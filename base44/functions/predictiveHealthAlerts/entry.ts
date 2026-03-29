import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Lab marker reference ranges
const MARKER_RANGES = {
  ldl: { optimal: { min: 0, max: 100 }, warning: { min: 100, max: 129 }, high: { min: 130 } },
  hdl: { low: { max: 39 }, optimal: { min: 40, max: 100 } },
  triglycerides: { optimal: { max: 150 }, warning: { min: 150, max: 200 }, high: { min: 200 } },
  vitamin_d: { deficient: { max: 20 }, insufficient: { min: 21, max: 29 }, optimal: { min: 30 } },
  hba1c: { prediabetic: { min: 5.7, max: 6.4 }, diabetic: { min: 6.5 } },
  sodium: { optimal: { max: 2300 } },
  fiber: { optimal: { min: 25, max: 35 } },
  potassium: { optimal: { min: 2600 } },
  calcium: { optimal: { min: 1000 } },
};

// Nutrient to lab marker mapping
const NUTRIENT_MARKERS = {
  saturated_fat: 'ldl',
  vitamin_d: 'vitamin_d',
  carbs: 'hba1c',
  sodium: 'sodium',
  fiber: 'triglycerides',
  potassium: 'potassium',
  calcium: 'calcium',
};

// Calculate average nutrient intake from last 30 days
async function getNutrientAverages(base44, userEmail) {
  const logs = await base44.entities.NutritionLog.filter(
    { created_by: userEmail },
    '-log_date',
    100
  );

  // Filter to last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentLogs = logs.filter(log => {
    const logDate = new Date(log.log_date);
    return logDate >= thirtyDaysAgo;
  });

  if (recentLogs.length === 0) return null;

  const nutrients = {
    saturated_fat: [],
    vitamin_d: [],
    carbs: [],
    sodium: [],
    fiber: [],
    potassium: [],
    calcium: [],
  };

  recentLogs.forEach(log => {
    if (log.fat) nutrients.saturated_fat.push(log.fat * 0.1); // Estimate saturated fat at 10% of total fat
    if (log.carbs) nutrients.carbs.push(log.carbs);
    if (log.sodium) nutrients.sodium.push(log.sodium);
    if (log.fiber) nutrients.fiber.push(log.fiber);
    
    // Micronutrients
    if (log.micronutrients) {
      if (log.micronutrients.vitamin_d) nutrients.vitamin_d.push(log.micronutrients.vitamin_d.value);
      if (log.micronutrients.potassium) nutrients.potassium.push(log.micronutrients.potassium.value);
      if (log.micronutrients.calcium) nutrients.calcium.push(log.micronutrients.calcium.value);
    }
  });

  // Calculate averages
  const averages = {};
  Object.keys(nutrients).forEach(key => {
    if (nutrients[key].length > 0) {
      averages[key] = nutrients[key].reduce((a, b) => a + b, 0) / nutrients[key].length;
    }
  });

  return {
    averages,
    daysOfData: recentLogs.length,
    logsAnalyzed: recentLogs.length,
  };
}

// Get latest lab result for a marker
async function getLatestLabResult(base44, userEmail, marker) {
  const results = await base44.entities.LabResult.filter(
    { created_by: userEmail },
    '-upload_date',
    10
  );

  if (results.length === 0) return null;

  // Find the lab result that contains this marker
  for (const result of results) {
    if (result.results && result.results[marker]) {
      return {
        value: result.results[marker],
        date: result.upload_date,
        marker,
      };
    }
  }

  return null;
}

// Generate alerts based on nutrient analysis
async function generateAlerts(base44, userEmail, nutrientData, userPrefs) {
  const alerts = [];

  if (!nutrientData) return alerts;

  const { averages, daysOfData } = nutrientData;

  // Alert 1: High Saturated Fat → LDL Risk
  if (averages.saturated_fat && averages.saturated_fat > 15) {
    const ldlResult = await getLatestLabResult(base44, userEmail, 'ldl');
    
    if (ldlResult && ldlResult.value >= 100) {
      const daysHigh = daysOfData;
      
      alerts.push({
        alert_type: 'saturated_fat_ldl',
        severity: ldlResult.value >= 130 ? 'urgent' : 'warning',
        message: `⚠️ High saturated fat intake detected. Your current LDL is ${ldlResult.value} mg/dL.`,
        current_metric: `${averages.saturated_fat.toFixed(1)}g saturated fat/day (last ${daysOfData} days)`,
        recommended_action: `Reduce saturated fat to under 10g/day. Switch to lean proteins and plant-based oils.`,
        suggested_foods: ['salmon', 'olive oil', 'chicken breast', 'almonds', 'avocado'],
        lab_reference: {
          marker_name: 'LDL Cholesterol',
          value: ldlResult.value,
          date: ldlResult.date,
        },
        predicted_direction: ldlResult.value > 120 ? 'trending_up' : 'stable',
        days_of_data: daysOfData,
      });
    }
  }

  // Alert 2: Low Vitamin D
  if (averages.vitamin_d && averages.vitamin_d < 400) {
    const vdResult = await getLatestLabResult(base44, userEmail, 'vitamin_d');
    
    if (vdResult && vdResult.value < 30) {
      alerts.push({
        alert_type: 'vitamin_d_deficiency',
        severity: vdResult.value < 20 ? 'urgent' : 'warning',
        message: `⚠️ Your Vitamin D intake from food has been low. Last level: ${vdResult.value} ng/mL.`,
        current_metric: `${averages.vitamin_d.toFixed(0)} IU/day from food (last ${daysOfData} days)`,
        recommended_action: `Add fatty fish 2-3x/week and fortified dairy. Consider a supplement if deficient.`,
        suggested_foods: ['salmon', 'mackerel', 'egg yolks', 'fortified milk', 'mushrooms'],
        lab_reference: {
          marker_name: 'Vitamin D 25-OH',
          value: vdResult.value,
          date: vdResult.date,
        },
        predicted_direction: 'trending_down',
        days_of_data: daysOfData,
      });
    }
  }

  // Alert 3: High Carbs for Pre-diabetic
  if (userPrefs?.diabetes_type === 'pre_diabetes' && averages.carbs && averages.carbs > 250) {
    const hba1cResult = await getLatestLabResult(base44, userEmail, 'hba1c');
    
    if (hba1cResult && hba1cResult.value >= 5.7) {
      alerts.push({
        alert_type: 'high_carbs_prediabetic',
        severity: hba1cResult.value > 6.2 ? 'urgent' : 'warning',
        message: `⚠️ Your carb intake is elevated for pre-diabetes. Last HbA1c: ${hba1cResult.value}%.`,
        current_metric: `${averages.carbs.toFixed(0)}g carbs/day (last ${daysOfData} days)`,
        recommended_action: `Target 150-200g carbs/day. Focus on high-fiber, low-glycemic options.`,
        suggested_foods: ['quinoa', 'sweet potato', 'lentils', 'brown rice', 'broccoli'],
        lab_reference: {
          marker_name: 'HbA1c',
          value: hba1cResult.value,
          date: hba1cResult.date,
        },
        predicted_direction: 'trending_up',
        days_of_data: daysOfData,
      });
    }
  }

  // Alert 4: Low Fiber
  if (averages.fiber && averages.fiber < 15) {
    alerts.push({
      alert_type: 'low_fiber',
      severity: 'advisory',
      message: `💡 Your fiber intake is below recommended levels. This affects cholesterol and blood sugar.`,
      current_metric: `${averages.fiber.toFixed(1)}g fiber/day (last ${daysOfData} days)`,
      recommended_action: `Increase to 25-35g/day. Add whole grains, legumes, and vegetables gradually.`,
      suggested_foods: ['oats', 'beans', 'lentils', 'vegetables', 'whole wheat bread'],
      predicted_direction: 'stable',
      days_of_data: daysOfData,
    });
  }

  // Alert 5: High Sodium for Hypertension
  if (userPrefs?.heart_condition === 'hypertension' && averages.sodium && averages.sodium > 2300) {
    alerts.push({
      alert_type: 'sodium_hypertension',
      severity: 'warning',
      message: `⚠️ Your sodium intake exceeds recommended limits for blood pressure management.`,
      current_metric: `${averages.sodium.toFixed(0)}mg sodium/day (last ${daysOfData} days)`,
      recommended_action: `Reduce to under 2,300mg/day. Limit processed foods and use herbs for seasoning.`,
      suggested_foods: ['fresh vegetables', 'lean meats', 'herbs', 'spices', 'low-sodium broths'],
      predicted_direction: 'trending_up',
      days_of_data: daysOfData,
    });
  }

  return alerts;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Check if running as scheduled task
    const isScheduledTask = req.headers.get('x-scheduled-task') === 'true';
    
    if (!isScheduledTask) {
      // Only allow scheduled execution
      return Response.json({ error: 'This function is for scheduled use only' }, { status: 403 });
    }

    // Get all users from User entity
    const allUsers = await base44.asServiceRole.entities.User.list();

    let processedCount = 0;
    let alertsCreated = 0;

    for (const user of allUsers) {
      try {
        // Get user preferences
        const prefs = await base44.asServiceRole.entities.UserPreferences.filter({
          created_by: user.email,
        });
        const userPrefs = prefs?.[0] || {};

        // Get nutrient averages for last 30 days
        const nutrientData = await getNutrientAverages(base44, user.email);

        if (!nutrientData) {
          continue; // No nutrition logs
        }

        // Generate alerts
        const alerts = await generateAlerts(base44, user.email, nutrientData, userPrefs);

        if (alerts.length === 0) {
          processedCount++;
          continue;
        }

        // Check for existing unacknowledged alerts
        const existingAlerts = await base44.asServiceRole.entities.HealthAlert.filter({
          user_email: user.email,
          acknowledged: false,
        });

        // Limit to max 2 active alerts per user
        const recentAlerts = alerts.slice(0, 2 - existingAlerts.length);

        // Create new alerts
        for (const alert of recentAlerts) {
          if (existingAlerts.length >= 2) break; // Cap at 2 total active

          await base44.asServiceRole.entities.HealthAlert.create({
            ...alert,
            user_email: user.email,
            acknowledged: false,
            email_sent: false,
          });

          alertsCreated++;
        }

        // Send email if new alerts created
        if (recentAlerts.length > 0) {
          const emailBody = recentAlerts
            .map(
              alert => `
${alert.message}

Current: ${alert.current_metric}
Action: ${alert.recommended_action}

Try: ${alert.suggested_foods?.slice(0, 3).join(', ')}
              `
            )
            .join('\n---\n');

          await base44.integrations.Core.SendEmail({
            to: user.email,
            subject: '🏥 Your Predictive Health Alerts from VitaPlate',
            body: `Hi ${user.full_name},\n\nBased on your eating patterns this month, we have some proactive health alerts:\n\n${emailBody}\n\nReview your alerts in the Dashboard and let's adjust your meal plan together!`,
          });
        }

        processedCount++;
      } catch (userError) {
        console.error(`Error processing user ${user.email}:`, userError);
        continue;
      }
    }

    return Response.json({
      success: true,
      processedUsers: processedCount,
      alertsCreated,
      message: `Processed ${processedCount} users, created ${alertsCreated} alerts`,
    });
  } catch (error) {
    console.error('Predictive health alerts error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});