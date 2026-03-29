import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Get all users
    const allUsers = await base44.asServiceRole.entities.User.list();

    // Get today's nutrition logs
    const todaysLogs = await base44.asServiceRole.entities.NutritionLog.filter({ log_date: todayStr });
    const usersLoggedToday = new Set(todaysLogs.map(l => l.created_by));

    let remindedCount = 0;

    for (const u of allUsers) {
      if (usersLoggedToday.has(u.email)) continue; // already logged today

      // Send reminder email
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: u.email,
        from_name: 'VitaPlate',
        subject: '🔥 Don\'t break your streak! Log your meals today',
        body: `Hi ${u.full_name || 'there'},

You haven't logged any meals today yet! Don't let your nutrition streak end.

Log your meals now to stay on track with your health goals: https://vitaplate.base44.app/NutritionTracking

Stay healthy,
The VitaPlate Team`
      });

      remindedCount++;
    }

    return Response.json({ success: true, reminded: remindedCount, total_users: allUsers.length });
  } catch (error) {
    console.error('Reminder error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});