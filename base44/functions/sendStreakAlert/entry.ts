import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userEmail } = await req.json();

    // Get user notification settings
    const settings = await base44.asServiceRole.entities.NotificationSettings.filter({ 
      created_by: userEmail 
    });
    const userSettings = settings?.[0];

    // Check if streak alerts are enabled
    if (!userSettings?.streak_alerts) {
      return Response.json({ skipped: true, reason: 'Streak alerts disabled' });
    }

    // Check quiet hours
    const now = new Date();
    const hour = now.getHours();
    if (userSettings?.quiet_hours_enabled && (hour >= 22 || hour < 7)) {
      return Response.json({ skipped: true, reason: 'During quiet hours' });
    }

    // Get user's current streak
    const streaks = await base44.asServiceRole.entities.UserStreak.filter({ 
      created_by: userEmail 
    });
    const streakData = streaks?.[0];

    if (!streakData || streakData.meal_log_streak < 3) {
      return Response.json({ skipped: true, reason: 'Streak is less than 3 days' });
    }

    // Check if any meals were logged today
    const today = now.toISOString().split('T')[0];
    const logs = await base44.asServiceRole.entities.NutritionLog.filter({
      created_by: userEmail,
      log_date: today
    });

    if (logs.length > 0) {
      return Response.json({ skipped: true, reason: 'Meals already logged today' });
    }

    // Create streak alert notification
    const notification = await base44.asServiceRole.entities.Notification.create({
      user_email: userEmail,
      type: 'streak_alert',
      title: `🔥 Don't break your ${streakData.meal_log_streak}-day streak!`,
      message: `You're ${streakData.meal_log_streak} days in! Log your meals today to keep your momentum going.`,
      action_url: '/NutritionTracking',
      notification_time: new Date().toISOString()
    });

    console.log(`Streak alert sent to ${userEmail} (${streakData.meal_log_streak} day streak)`);
    return Response.json({ success: true, notificationId: notification.id });
  } catch (error) {
    console.error('Error sending streak alert:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});