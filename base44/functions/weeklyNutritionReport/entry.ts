import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const allUsers = await base44.asServiceRole.entities.User.list();

    const today = new Date();
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - 7);
    const fromDate = lastMonday.toISOString().split('T')[0];
    const toDate = today.toISOString().split('T')[0];

    let sentCount = 0;

    for (const u of allUsers) {
      try {
        // Get last week's logs for this user
        const logs = await base44.asServiceRole.entities.NutritionLog.filter({ created_by: u.email });
        const weekLogs = logs.filter(l => l.log_date >= fromDate && l.log_date < toDate);

        if (weekLogs.length === 0) continue;

        // Compute averages
        const avgCalories = Math.round(weekLogs.reduce((s, l) => s + (l.calories || 0), 0) / weekLogs.length);
        const avgProtein = Math.round(weekLogs.reduce((s, l) => s + (l.protein || 0), 0) / weekLogs.length);
        const avgCarbs = Math.round(weekLogs.reduce((s, l) => s + (l.carbs || 0), 0) / weekLogs.length);
        const avgFat = Math.round(weekLogs.reduce((s, l) => s + (l.fat || 0), 0) / weekLogs.length);

        // Streak: count consecutive days logged up to today
        const loggedDays = new Set(weekLogs.map(l => l.log_date));
        let streak = 0;
        for (let i = 0; i < 7; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          if (loggedDays.has(d.toISOString().split('T')[0])) streak++;
          else break;
        }

        // Get most recent lab results
        const labResults = await base44.asServiceRole.entities.LabResult.filter({ created_by: u.email }, '-upload_date', 1);
        const latestLab = labResults[0];

        const labContext = latestLab?.biomarkers
          ? Object.entries(latestLab.biomarkers)
              .filter(([, v]) => v?.status && v.status !== 'normal')
              .map(([k, v]) => `${k}: ${v.value} ${v.unit} (${v.status})`)
              .join(', ')
          : '';

        // AI-generated tip
        const tipResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Give ONE concise, actionable nutrition tip (2-3 sentences) for a user with:
- Avg daily calories last week: ${avgCalories} kcal
- Avg protein: ${avgProtein}g, carbs: ${avgCarbs}g, fat: ${avgFat}g
- Logging streak: ${streak} days
${labContext ? `- Abnormal lab markers: ${labContext}` : ''}
Make it specific and encouraging. No intro phrase needed.`,
        });

        const tip = typeof tipResult === 'string' ? tipResult : tipResult?.tip || '';

        const weekRange = `${fromDate} – ${toDate}`;

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: u.email,
          from_name: 'VitaPlate',
          subject: `📊 Your Weekly Nutrition Report (${weekRange})`,
          body: `Hi ${u.full_name || 'there'},

Here's your personalized nutrition summary for last week:

📅 WEEK: ${weekRange}
📝 Meals logged: ${weekLogs.length}
🔥 Avg Calories: ${avgCalories} kcal/day
💪 Avg Protein: ${avgProtein}g/day
🌾 Avg Carbs: ${avgCarbs}g/day
🥑 Avg Fat: ${avgFat}g/day
🔥 Current streak: ${streak} day${streak !== 1 ? 's' : ''}

💡 YOUR PERSONALIZED TIP:
${tip}

Keep up the great work! Log your meals this week:
https://vitaplate.ai/NutritionTracking

Stay healthy,
The VitaPlate Team`
        });

        sentCount++;
      } catch (userErr) {
        console.error(`Failed for user ${u.email}:`, userErr.message);
      }
    }

    console.log(`Weekly reports sent to ${sentCount} users`);
    return Response.json({ success: true, sent: sentCount });
  } catch (error) {
    console.error('Weekly report error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});