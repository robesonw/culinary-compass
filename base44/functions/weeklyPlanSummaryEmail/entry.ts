import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  // PAUSED: All email notifications disabled until further notice
  return Response.json({ skipped: true, reason: 'Notifications paused by admin' });

  try {
    const base44 = createClientFromRequest(req);

    // This runs as a scheduled job — use service role
    const allUsers = await base44.asServiceRole.entities.User.list();

    let sentCount = 0;

    for (const u of allUsers) {
      // Get the most recent meal plan for this user
      const plans = await base44.asServiceRole.entities.MealPlan.filter(
        { created_by: u.email },
        '-created_date',
        1
      );

      const plan = plans[0];
      if (!plan) continue;

      // Build meal summary
      const daysSummary = (plan.days || []).slice(0, 7).map(day => {
        const meals = ['breakfast', 'lunch', 'dinner', 'snacks']
          .filter(m => day[m]?.name)
          .map(m => `${m.charAt(0).toUpperCase() + m.slice(1)}: ${day[m].name}`)
          .join(', ');
        return `${day.day}: ${meals}`;
      }).join('\n');

      const macroLine = plan.macros
        ? `Avg daily macros — Protein: ${plan.macros.protein || 0}g | Carbs: ${plan.macros.carbs || 0}g | Fat: ${plan.macros.fat || 0}g`
        : '';

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: u.email,
        from_name: 'VitaPlate',
        subject: `🥗 Your Weekly Meal Plan Summary — ${plan.name}`,
        body: `Hi ${u.full_name || 'there'},

Here's a summary of your current meal plan: "${plan.name}"

${daysSummary}

${macroLine}

${plan.estimated_cost ? `Estimated grocery cost: $${plan.estimated_cost.toFixed(2)}` : ''}

View your full plan and grocery list: https://vitaplate.ai/MealPlans

Have a healthy week!
The VitaPlate Team`
      });

      sentCount++;
    }

    return Response.json({ success: true, sent: sentCount });
  } catch (error) {
    console.error('Weekly summary error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});