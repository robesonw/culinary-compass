import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const LOINC_TO_BIOMARKER = {
  '2093-3': 'Total Cholesterol',
  '18262-6': 'LDL Cholesterol',
  '2085-9': 'HDL Cholesterol',
  '2571-8': 'Triglycerides',
  '2339-0': 'Glucose',
  '4548-4': 'HbA1c',
  '1989-3': 'Vitamin D',
  '2498-4': 'Ferritin',
  '1988-5': 'CRP',
  '3016-3': 'TSH',
  '2132-9': 'Vitamin B12',
  '2601-3': 'Magnesium',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fhir_observations } = await req.json();

    if (!fhir_observations || !Array.isArray(fhir_observations)) {
      return Response.json({ error: 'Invalid FHIR observations data' }, { status: 400 });
    }

    // Parse FHIR Observation resources
    const biomarkers = {};
    let testDate = new Date().toISOString().split('T')[0];

    for (const observation of fhir_observations) {
      try {
        // Extract LOINC code from coding
        const loincCode = observation.code?.coding?.find(c => c.system === 'http://loinc.org')?.code;
        if (!loincCode) continue;

        const biomarkerName = LOINC_TO_BIOMARKER[loincCode];
        if (!biomarkerName) continue;

        // Extract value and unit
        const valueQuantity = observation.value?.valueQuantity;
        if (!valueQuantity || valueQuantity.value === undefined) continue;

        const value = valueQuantity.value;
        const unit = valueQuantity.unit || '';
        const referenceRange = observation.referenceRange?.[0];
        
        // Determine status based on reference range
        let status = 'normal';
        if (referenceRange) {
          const low = referenceRange.low?.value;
          const high = referenceRange.high?.value;
          if (low && value < low) status = 'low';
          else if (high && value > high) status = 'high';
        }

        // Use observation effective date if available
        if (observation.effectiveDateTime) {
          const obsDate = observation.effectiveDateTime.split('T')[0];
          testDate = obsDate;
        }

        biomarkers[biomarkerName] = {
          value,
          unit,
          status,
          reference_range: referenceRange 
            ? `${referenceRange.low?.value || ''}-${referenceRange.high?.value || ''}`.trim()
            : '',
        };
      } catch (e) {
        console.error('Error parsing observation:', e);
      }
    }

    if (Object.keys(biomarkers).length === 0) {
      return Response.json(
        { error: 'No valid FHIR observations could be parsed' },
        { status: 400 }
      );
    }

    // Save to LabResult entity
    const result = await base44.asServiceRole.entities.LabResult.create({
      upload_date: testDate,
      biomarkers,
      source: 'apple_health_fhir',
      notes: 'Auto-imported from Apple Health Records (FHIR)',
    });

    return Response.json({
      success: true,
      result_id: result.id,
      biomarker_count: Object.keys(biomarkers).length,
      test_date: testDate,
      biomarkers: Object.keys(biomarkers),
    });
  } catch (error) {
    console.error('FHIR import error:', error);
    return Response.json(
      { error: error.message || 'Failed to import FHIR lab results' },
      { status: 500 }
    );
  }
});