import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SUPPLEMENT_RULES = [
  {
    name: 'Vitamin D3 + K2 Combined',
    condition: (biomarkers) => biomarkers['Vitamin D']?.value < 30,
    dose: '5,000 IU D3 + 100mcg K2 daily',
    form: 'Softgel',
    why: (biomarkers) => `Your Vitamin D is ${biomarkers['Vitamin D']?.value} — significantly below the optimal range of 40-80 ng/mL. D3+K2 combo ensures calcium goes to bones, not arteries.`,
    notes: 'Take with a meal containing fat for better absorption.',
    amazonSearch: 'Vitamin D3 K2 5000 IU softgel',
    priority: 'HIGH',
  },
  {
    name: 'Vitamin D3',
    condition: (biomarkers) => {
      const vd = biomarkers['Vitamin D']?.value;
      return vd >= 30 && vd <= 40;
    },
    dose: '2,000 IU daily',
    form: 'Softgel',
    why: (biomarkers) => `Your Vitamin D is ${biomarkers['Vitamin D']?.value} — slightly below optimal. Maintenance dose to bring it into range.`,
    notes: 'Take with a meal containing fat.',
    amazonSearch: 'Vitamin D3 2000 IU softgel',
    priority: 'MEDIUM',
  },
  {
    name: 'Iron Bisglycinate',
    condition: (biomarkers) => {
      const ferritin = biomarkers['Ferritin']?.value;
      const iron = biomarkers['Iron']?.value;
      return (ferritin && ferritin < 12) || (iron && iron < 60);
    },
    dose: '25-36mg elemental iron daily with Vitamin C',
    form: 'Capsule',
    why: (biomarkers) => {
      const ferritin = biomarkers['Ferritin']?.value;
      const iron = biomarkers['Iron']?.value;
      const value = ferritin || iron;
      return `Your iron stores are ${value} — low. Bisglycinate form is gentle on the stomach and highly absorbable.`;
    },
    notes: 'Take with 250mg Vitamin C for best absorption. Do not take with calcium.',
    amazonSearch: 'Iron Bisglycinate 25mg gentle',
    priority: 'HIGH',
  },
  {
    name: 'Methylcobalamin B12',
    condition: (biomarkers) => biomarkers['Vitamin B12']?.value < 300,
    dose: '1,000mcg daily, under the tongue',
    form: 'Sublingual',
    why: (biomarkers) => `Your B12 is ${biomarkers['Vitamin B12']?.value} — below optimal. Methylcobalamin is the active form — more effective than cyanocobalamin.`,
    notes: 'Best absorbed sublingually. Take away from food.',
    amazonSearch: 'Methylcobalamin B12 1000mcg sublingual',
    priority: 'HIGH',
  },
  {
    name: 'Magnesium Glycinate',
    condition: (biomarkers) => biomarkers['Magnesium']?.value < 1.8,
    dose: '300-400mg daily, before bed',
    form: 'Capsule',
    why: (biomarkers) => `Your magnesium is ${biomarkers['Magnesium']?.value}. Glycinate form is highly bioavailable and promotes better sleep and muscle recovery.`,
    notes: 'Take 30-60 minutes before bed for best sleep support.',
    amazonSearch: 'Magnesium Glycinate 400mg',
    priority: 'MEDIUM',
  },
  {
    name: 'Omega-3 Fish Oil',
    condition: (biomarkers) => biomarkers['Triglycerides']?.value > 150,
    dose: '2-4g EPA+DHA daily with meals',
    form: 'Softgel',
    why: (biomarkers) => `Your triglycerides are ${biomarkers['Triglycerides']?.value} — elevated. High-dose Omega-3 can reduce triglycerides by 20-30% and reduce inflammation.`,
    notes: 'Must contain at least 1,000mg combined EPA+DHA per serving.',
    amazonSearch: 'Omega-3 Fish Oil 2000mg EPA DHA high potency',
    priority: 'HIGH',
  },
  {
    name: 'Curcumin + Piperine',
    condition: (biomarkers) => biomarkers['CRP']?.value > 1.0,
    dose: '500-1,000mg curcumin with 5-10mg piperine daily',
    form: 'Capsule',
    why: (biomarkers) => `Your CRP is ${biomarkers['CRP']?.value} — indicating elevated systemic inflammation. Curcumin with piperine has strong anti-inflammatory evidence.`,
    notes: 'Must contain piperine (BioPerine) for absorption — plain turmeric is poorly absorbed.',
    amazonSearch: 'Curcumin BioPerine 1000mg',
    priority: 'HIGH',
  },
  {
    name: 'CoQ10',
    condition: (biomarkers) => biomarkers['LDL Cholesterol']?.value > 130,
    dose: '100-200mg daily with food',
    form: 'Softgel',
    why: (biomarkers) => `Your LDL is ${biomarkers['LDL Cholesterol']?.value}. CoQ10 supports cardiovascular health and may help reduce LDL.`,
    notes: 'Take with a fat-containing meal for best absorption.',
    amazonSearch: 'CoQ10 200mg ubiquinol',
    priority: 'MEDIUM',
  },
  {
    name: 'Zinc Picolinate',
    condition: (biomarkers) => biomarkers['Zinc']?.value < 60,
    dose: '15-30mg daily with food',
    form: 'Tablet',
    why: (biomarkers) => `Your zinc is ${biomarkers['Zinc']?.value} — low. Zinc picolinate is the most bioavailable form. Important for immune function and wound healing.`,
    notes: 'Do not exceed 40mg daily. Take with food to avoid nausea.',
    amazonSearch: 'Zinc Picolinate 30mg',
    priority: 'MEDIUM',
  },
  {
    name: 'Iodine + Selenium Stack',
    condition: (biomarkers) => biomarkers['TSH']?.value > 4.0,
    dose: '150mcg Iodine, 200mcg Selenium daily',
    form: 'Capsule',
    why: (biomarkers) => `Your TSH is ${biomarkers['TSH']?.value} — elevated, indicating possible thyroid stress. Iodine and selenium are essential thyroid nutrients.`,
    notes: 'Consult your doctor before starting iodine if you have autoimmune thyroid disease.',
    amazonSearch: 'Iodine Selenium thyroid support',
    priority: 'MEDIUM',
  },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { labResultId } = await req.json();

    if (!labResultId) {
      return Response.json({ error: 'Missing labResultId' }, { status: 400 });
    }

    // Get lab result
    const labResult = await base44.asServiceRole.entities.LabResult.filter(
      { id: labResultId }
    );

    if (!labResult || labResult.length === 0) {
      return Response.json({ error: 'Lab result not found' }, { status: 404 });
    }

    const biomarkers = labResult[0].biomarkers || {};

    // Generate recommendations
    const recommendations = SUPPLEMENT_RULES
      .filter(rule => rule.condition(biomarkers))
      .map(rule => ({
        name: rule.name,
        dose: rule.dose,
        form: rule.form,
        why: rule.why(biomarkers),
        notes: rule.notes,
        amazonSearch: rule.amazonSearch,
        priority: rule.priority,
        estimatedMonthlyCost: rule.priority === 'HIGH' ? 40 : 30,
      }));

    // Sort by priority
    const priorityOrder = { HIGH: 0, MEDIUM: 1, MAINTENANCE: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    // Calculate total cost
    const totalMonthlyCost = recommendations.reduce((sum, rec) => sum + rec.estimatedMonthlyCost, 0);

    return Response.json({
      success: true,
      recommendations,
      totalMonthlyCost,
      recommendationCount: recommendations.length,
      labResultDate: labResult[0].upload_date,
    });
  } catch (error) {
    console.error('Supplement plan generation error:', error);
    return Response.json(
      { error: error.message || 'Failed to generate supplement plan' },
      { status: 500 }
    );
  }
});