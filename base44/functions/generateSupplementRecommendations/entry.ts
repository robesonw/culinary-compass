import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Analyzes lab results and generates personalized supplement recommendations
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { labResultId } = await req.json();

    if (!labResultId) {
      return Response.json({ error: 'Lab result ID required' }, { status: 400 });
    }

    // Fetch the lab result
    const labResult = await base44.entities.LabResult.filter({ id: labResultId }, '', 1);
    if (!labResult || labResult.length === 0) {
      return Response.json({ error: 'Lab result not found' }, { status: 404 });
    }

    const lab = labResult[0];
    const biomarkers = lab.biomarkers || {};
    const recommendations = [];

    // Vitamin D recommendations
    if (biomarkers.VitaminD) {
      const value = biomarkers.VitaminD.value;
      if (value < 30) {
        recommendations.push({
          priority: 1,
          name: 'Vitamin D3 + K2',
          form: 'Softgel',
          dosage: '5,000 IU D3 + 100mcg K2 daily',
          reason: `Your Vitamin D is ${value} ng/mL — below the optimal range of 40-80 ng/mL`,
          benefits: 'Supports bone health, immune function, mood regulation',
          productUrl: 'https://www.amazon.com/s?k=Vitamin+D3+K2+5000+IU&tag=vitaplate-20',
          rating: 4.7,
          reviews: 12500,
          amazonSearch: 'Vitamin D3 K2 5000 IU'
        });
      } else if (value >= 30 && value < 40) {
        recommendations.push({
          priority: 2,
          name: 'Vitamin D3',
          form: 'Softgel',
          dosage: '2,000 IU daily (maintenance)',
          reason: `Your Vitamin D is ${value} ng/mL — approaching optimal range`,
          benefits: 'Maintains healthy vitamin D levels',
          productUrl: 'https://www.amazon.com/s?k=Vitamin+D3+2000+IU&tag=vitaplate-20',
          rating: 4.6,
          reviews: 8200,
          amazonSearch: 'Vitamin D3 2000 IU'
        });
      }
    }

    // Ferritin recommendations
    if (biomarkers.Ferritin) {
      const value = biomarkers.Ferritin.value;
      if (value < 12) {
        recommendations.push({
          priority: 1,
          name: 'Iron Bisglycinate',
          form: 'Capsule',
          dosage: '15-25mg elemental iron daily with vitamin C',
          reason: `Your Ferritin is ${value} ng/mL — indicates low iron stores`,
          benefits: 'Supports energy, reduces fatigue, gentle on digestion',
          productUrl: 'https://www.amazon.com/s?k=Iron+Bisglycinate+15mg&tag=vitaplate-20',
          rating: 4.5,
          reviews: 6800,
          amazonSearch: 'Iron Bisglycinate'
        });
      }
    }

    // B12 recommendations
    if (biomarkers.B12) {
      const value = biomarkers.B12.value;
      if (value < 300) {
        recommendations.push({
          priority: 1,
          name: 'Methylcobalamin B12',
          form: 'Sublingual Tablet',
          dosage: '1,000mcg 2-3x per week or daily',
          reason: `Your B12 is ${value} pg/mL — below optimal range (400-900 pg/mL)`,
          benefits: 'Energy, nerve health, mood support, reduces homocysteine',
          productUrl: 'https://www.amazon.com/s?k=Methylcobalamin+B12+1000mcg&tag=vitaplate-20',
          rating: 4.8,
          reviews: 9500,
          amazonSearch: 'Methylcobalamin B12 1000mcg'
        });
      }
    }

    // Magnesium recommendations
    if (biomarkers.Magnesium) {
      const value = biomarkers.Magnesium.value;
      if (value < 1.8) {
        recommendations.push({
          priority: 2,
          name: 'Magnesium Glycinate',
          form: 'Capsule',
          dosage: '400mg daily (split dose recommended)',
          reason: `Your Magnesium is ${value} mg/dL — below optimal range`,
          benefits: 'Muscle relaxation, sleep quality, stress management',
          productUrl: 'https://www.amazon.com/s?k=Magnesium+Glycinate+400mg&tag=vitaplate-20',
          rating: 4.6,
          reviews: 7200,
          amazonSearch: 'Magnesium Glycinate 400mg'
        });
      }
    }

    // CRP (inflammation) recommendations
    if (biomarkers.CRP) {
      const value = biomarkers.CRP.value;
      if (value > 1.0) {
        recommendations.push({
          priority: 1,
          name: 'Curcumin with Piperine',
          form: 'Capsule',
          dosage: '500-1000mg turmeric (95% curcuminoids) daily',
          reason: `Your CRP is ${value} — indicates inflammation`,
          benefits: 'Reduces inflammation, supports joint health, antioxidant',
          productUrl: 'https://www.amazon.com/s?k=Curcumin+Piperine+500mg&tag=vitaplate-20',
          rating: 4.7,
          reviews: 8900,
          amazonSearch: 'Curcumin Piperine turmeric'
        });

        recommendations.push({
          priority: 1,
          name: 'Omega-3 Fish Oil',
          form: 'Softgel',
          dosage: '2,000mg EPA+DHA daily',
          reason: 'Supports anti-inflammatory response',
          benefits: 'Reduces inflammation, heart health, brain function',
          productUrl: 'https://www.amazon.com/s?k=Omega3+Fish+Oil+2000mg&tag=vitaplate-20',
          rating: 4.6,
          reviews: 11200,
          amazonSearch: 'Omega-3 Fish Oil 2000mg EPA DHA'
        });
      }
    }

    // HDL recommendations
    if (biomarkers.HDL) {
      const value = biomarkers.HDL.value;
      if (value < 40) {
        recommendations.push({
          priority: 2,
          name: 'Niacin (Flush-Free)',
          form: 'Capsule',
          dosage: '500-1000mg daily',
          reason: `Your HDL is ${value} mg/dL — below optimal (>40 mg/dL)`,
          benefits: 'Raises HDL cholesterol, supports cardiovascular health',
          productUrl: 'https://www.amazon.com/s?k=Niacin+Flush+Free+500mg&tag=vitaplate-20',
          rating: 4.5,
          reviews: 5600,
          amazonSearch: 'Niacin Flush Free'
        });

        recommendations.push({
          priority: 2,
          name: 'CoQ10',
          form: 'Softgel',
          dosage: '100-200mg daily',
          reason: 'Supports cardiovascular health and energy production',
          benefits: 'Heart health, cellular energy, statin support',
          productUrl: 'https://www.amazon.com/s?k=CoQ10+Ubiquinone+100mg&tag=vitaplate-20',
          rating: 4.7,
          reviews: 9800,
          amazonSearch: 'CoQ10 Ubiquinone 100mg'
        });
      }
    }

    // Homocysteine recommendations
    if (biomarkers.Homocysteine) {
      const value = biomarkers.Homocysteine.value;
      if (value > 12) {
        recommendations.push({
          priority: 1,
          name: 'B-Complex (B6, B12, Folate)',
          form: 'Capsule/Tablet',
          dosage: 'As directed (typically daily)',
          reason: `Your Homocysteine is ${value} µmol/L — elevated (optimal <10)`,
          benefits: 'Reduces homocysteine, supports cardiovascular health',
          productUrl: 'https://www.amazon.com/s?k=B+Complex+B6+B12+Folate&tag=vitaplate-20',
          rating: 4.6,
          reviews: 7400,
          amazonSearch: 'B Complex B6 B12 Folate'
        });
      }
    }

    // TSH recommendations
    if (biomarkers.TSH) {
      const value = biomarkers.TSH.value;
      if (value > 4.0) {
        recommendations.push({
          priority: 1,
          name: 'Iodine + Selenium',
          form: 'Tablet/Capsule',
          dosage: 'Iodine 150mcg + Selenium 200mcg daily',
          reason: `Your TSH is ${value} mIU/L — elevated (optimal 0.4-4.0)`,
          benefits: 'Supports thyroid function, metabolism',
          productUrl: 'https://www.amazon.com/s?k=Iodine+Selenium+thyroid&tag=vitaplate-20',
          rating: 4.5,
          reviews: 4300,
          amazonSearch: 'Iodine Selenium thyroid'
        });
      }
    }

    // Zinc recommendations
    if (biomarkers.Zinc) {
      const value = biomarkers.Zinc.value;
      if (value < 60) {
        recommendations.push({
          priority: 2,
          name: 'Zinc Picolinate',
          form: 'Capsule',
          dosage: '30mg daily (preferably with food)',
          reason: `Your Zinc is ${value} mcg/dL — below optimal range`,
          benefits: 'Immune support, wound healing, antioxidant',
          productUrl: 'https://www.amazon.com/s?k=Zinc+Picolinate+30mg&tag=vitaplate-20',
          rating: 4.6,
          reviews: 6900,
          amazonSearch: 'Zinc Picolinate 30mg'
        });
      }
    }

    // Sort by priority and remove duplicates
    const uniqueRecommendations = [];
    const seen = new Set();
    recommendations.sort((a, b) => a.priority - b.priority);
    
    for (const rec of recommendations) {
      if (!seen.has(rec.name)) {
        uniqueRecommendations.push(rec);
        seen.add(rec.name);
      }
    }

    return Response.json({
      success: true,
      recommendations: uniqueRecommendations,
      topPriority: uniqueRecommendations.filter(r => r.priority === 1).slice(0, 3),
      labResultId: labResultId
    });
  } catch (error) {
    console.error('Supplement recommendation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});