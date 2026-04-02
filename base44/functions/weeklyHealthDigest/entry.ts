import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all users
    const users = await base44.asServiceRole.entities.User.list();
    
    for (const user of users) {
      // Check if user has digest enabled
      if (user.weekly_digest_enabled === false) continue;

      // Check if user was active in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentLogs = await base44.asServiceRole.entities.NutritionLog.filter({
        created_by: user.email,
        created_date: { $gte: thirtyDaysAgo.toISOString() }
      }, '', 1);

      if (recentLogs.length === 0) {
        console.log(`Skipping ${user.email} - no activity in 30 days`);
        continue;
      }

      // Get user's last 7 days of nutrition logs
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const weekLogs = await base44.asServiceRole.entities.NutritionLog.filter({
        created_by: user.email,
        log_date: { $gte: lastWeek.toISOString().split('T')[0] }
      }, '-log_date', 100);

      // Get user preferences
      const userPrefs = await base44.asServiceRole.entities.UserPreferences.filter({
        created_by: user.email
      }, '', 1);
      const prefs = userPrefs[0] || {};

      // Get latest lab results
      const labs = await base44.asServiceRole.entities.LabResult.filter({
        created_by: user.email
      }, '-upload_date', 1);
      const latestLab = labs[0] || null;

      // Get current meal plan
      const plans = await base44.asServiceRole.entities.MealPlan.filter({
        created_by: user.email
      }, '-created_date', 1);
      const currentPlan = plans[0] || null;

      // Calculate week stats
      const mealsLogged = weekLogs.length;
      const daysActive = new Set(weekLogs.map(log => log.log_date)).size;
      const totalCalories = weekLogs.reduce((sum, log) => sum + (log.calories || 0), 0);
      const avgDailyCalories = daysActive > 0 ? Math.round(totalCalories / daysActive) : 0;
      const calorieGoal = prefs.age && prefs.weight ? Math.round(2000 + (prefs.weight * 10)) : 2000;

      // Nutrient analysis
      const nutrients = {
        protein: { total: 0, days: 0 },
        carbs: { total: 0, days: 0 },
        fat: { total: 0, days: 0 }
      };
      weekLogs.forEach(log => {
        if (log.protein) { nutrients.protein.total += log.protein; nutrients.protein.days++; }
        if (log.carbs) { nutrients.carbs.total += log.carbs; nutrients.carbs.days++; }
        if (log.fat) { nutrients.fat.total += log.fat; nutrients.fat.days++; }
      });

      const avgProtein = nutrients.protein.days > 0 ? Math.round(nutrients.protein.total / nutrients.protein.days) : 0;
      const avgCarbs = nutrients.carbs.days > 0 ? Math.round(nutrients.carbs.total / nutrients.carbs.days) : 0;
      const avgFat = nutrients.fat.days > 0 ? Math.round(nutrients.fat.total / nutrients.fat.days) : 0;

      // Determine health score trend (simplified)
      const healthScore = Math.min(100, Math.round((daysActive / 7) * 100));
      const lastWeekScore = daysActive >= 5 ? 'up' : daysActive >= 3 ? 'stable' : 'down';

      // Lab insight
      let labInsight = '';
      if (latestLab?.biomarkers) {
        const b = latestLab.biomarkers;
        if (b.Glucose?.status === 'high') {
          labInsight = 'Your blood glucose is elevated. This week, focus on low-glycemic meals with plenty of fiber and lean protein. Try adding cinnamon to your meals!';
        } else if (b.Glucose?.status === 'low') {
          labInsight = 'Your blood glucose is low. Include more complex carbs like oats, sweet potatoes, and legumes throughout the day.';
        } else if (b['Vitamin D']?.value < 30 || b['25(OH)D']?.value < 30) {
          labInsight = 'Your Vitamin D is still low. Eat more fatty fish (salmon 3x/week), egg yolks, and mushrooms exposed to sunlight.';
        } else if (b.LDL?.value > 130) {
          labInsight = 'Your LDL cholesterol is elevated. Swap saturated fats for omega-3 rich foods like sardines, walnuts, and flaxseeds.';
        } else if (b.Triglycerides?.value > 150) {
          labInsight = 'Your triglycerides are high. Cut added sugars and refined carbs. Prioritize omega-3 fatty acids and fiber.';
        } else if (b.CRP?.value > 1.0) {
          labInsight = 'Your inflammation markers are elevated. Add anti-inflammatory foods: turmeric, ginger, berries, and fatty fish.';
        } else {
          labInsight = 'Your lab results look great! Keep up the healthy habits you\'ve been maintaining.';
        }
      } else {
        labInsight = 'Upload your lab results so I can give you personalized nutrition advice based on your biomarkers.';
      }

      // Meal plan preview
      let mealPreview = '';
      if (currentPlan?.days && currentPlan.days.length > 0) {
        const firstMeals = currentPlan.days.slice(0, 3).map(day =>
          `${day.day}: ${day.breakfast?.name || '?'} / ${day.lunch?.name || '?'} / ${day.dinner?.name || '?'}`
        ).join('<br>');
        mealPreview = `<strong>Upcoming meals:</strong><br>${firstMeals}`;
      }

      // Generate dynamic subject line
      let subjectLine = 'Your VitaPlate Week';
      if (daysActive >= 5) {
        subjectLine = `Your VitaPlate Week: You logged ${daysActive}/7 days 🎉`;
      } else if (daysActive >= 3) {
        subjectLine = `Nova has 3 tips for your health this week 🥗`;
      } else if (labInsight.includes('low')) {
        subjectLine = `${labInsight.split('.')[0]} — here's what to eat`;
      }

      // Build HTML email
      const htmlEmail = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .header p { margin: 8px 0 0 0; opacity: 0.9; font-size: 14px; }
    .section { background: #f8f9fa; padding: 20px; margin: 15px 0; border-left: 4px solid #667eea; border-radius: 4px; }
    .section h2 { margin-top: 0; color: #333; font-size: 18px; }
    .metric { display: inline-block; margin-right: 20px; }
    .metric-value { font-size: 24px; font-weight: bold; color: #667eea; }
    .metric-label { font-size: 12px; color: #666; text-transform: uppercase; }
    .highlight { background: #fff3cd; padding: 15px; border-radius: 4px; border-left: 4px solid #ffc107; }
    .score-up { color: #28a745; }
    .score-down { color: #dc3545; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #999; border-top: 1px solid #ddd; margin-top: 30px; }
    .footer a { color: #667eea; text-decoration: none; }
    .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 4px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✨ Your VitaPlate Week</h1>
      <p>Personalized health insights for ${user.full_name || 'you'}</p>
    </div>

    <div style="padding: 20px; background: white;">
      <p>Hi ${user.full_name?.split(' ')[0] || 'there'},</p>
      <p>Your AI nutrition coach reviewed your week. Here's what happened:</p>

      <div class="section">
        <h2>📊 Your Week in Review</h2>
        <div class="metric">
          <div class="metric-value">${daysActive}</div>
          <div class="metric-label">Days Logged</div>
        </div>
        <div class="metric">
          <div class="metric-value">${avgDailyCalories}</div>
          <div class="metric-label">Avg Calories</div>
        </div>
        <div class="metric">
          <div class="metric-value">${avgProtein}g</div>
          <div class="metric-label">Protein</div>
        </div>
        <p style="margin-top: 20px; font-size: 14px;">
          You logged <strong>${mealsLogged} meals</strong> last week. Your average daily intake was <strong>${avgDailyCalories} kcal</strong> 
          (goal: ~${calorieGoal} kcal). Your macros averaged: ${avgProtein}g protein, ${avgCarbs}g carbs, ${avgFat}g fat.
        </p>
      </div>

      <div class="section highlight">
        <h2>🔬 Lab Insight of the Week</h2>
        <p>${labInsight}</p>
      </div>

      ${mealPreview ? `
      <div class="section">
        <h2>🍽️ This Week's Meal Plan</h2>
        <p>${mealPreview}</p>
      </div>
      ` : ''}

      <div class="section">
        <h2>❤️ Your Health Score</h2>
        <p>This week: <strong>${healthScore}%</strong> <span class="score-${lastWeekScore}">${lastWeekScore === 'up' ? '↑ Great job!' : lastWeekScore === 'stable' ? '→ Steady pace' : '↓ Keep going'}</span></p>
        <p style="font-size: 14px; margin-top: 10px;">
          ${lastWeekScore === 'up' ? '🎉 You\'re crushing your goals! Keep this momentum up.' : 
            lastWeekScore === 'stable' ? '💪 You\'re on the right track. Small steps lead to big changes.' : 
            '🌱 Every day is a fresh opportunity. Focus on logging consistently this week.'}
        </p>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <a href="https://vitaplate.ai/Dashboard" class="button">View Full Dashboard</a>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 10px 0;">VitaPlate • Your AI-Powered Nutrition Coach</p>
      <p style="margin: 0;">
        <a href="https://vitaplate.ai/Settings">Manage Preferences</a> | 
        <a href="https://vitaplate.ai/Settings">Unsubscribe from Weekly Digest</a>
      </p>
    </div>
  </div>
</body>
</html>
      `;

      // Send email
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          subject: subjectLine,
          body: htmlEmail,
          from_name: 'Nova, Your VitaPlate Coach'
        });
        console.log(`✓ Sent digest to ${user.email}`);
      } catch (emailErr) {
        console.error(`✗ Failed to send to ${user.email}:`, emailErr.message);
      }
    }

    return Response.json({ success: true, processed: users.length });
  } catch (error) {
    console.error('Weekly digest error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});