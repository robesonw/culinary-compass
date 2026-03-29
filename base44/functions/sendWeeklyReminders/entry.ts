import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userEmail, reminderType } = await req.json();

    // Get user notification settings
    const settings = await base44.asServiceRole.entities.NotificationSettings.filter({ 
      created_by: userEmail 
    });
    const userSettings = settings?.[0];

    let enabled = false;
    let title = '';
    let message = '';
    let actionUrl = '';

    switch(reminderType) {
      case 'weekly_plan':
        enabled = userSettings?.weekly_plan_reminder;
        title = '📅 Your meal plan for next week is ready!';
        message = 'Check out your personalized meal plan to stay on track for the week ahead.';
        actionUrl = '/MealPlans';
        break;
      case 'weekly_digest':
        enabled = userSettings?.weekly_digest;
        title = '📊 Your weekly health digest is ready';
        message = 'See your nutrition summary, progress, and tips for next week.';
        actionUrl = '/Analytics';
        break;
      case 'goal_checkin':
        enabled = userSettings?.goal_checkin;
        title = '🎯 Weekly goal check-in';
        message = 'Review your progress towards your health goals this week.';
        actionUrl = '/Dashboard';
        break;
    }

    if (!enabled) {
      return Response.json({ skipped: true, reason: `${reminderType} disabled` });
    }

    // Check quiet hours
    const now = new Date();
    const hour = now.getHours();
    if (userSettings?.quiet_hours_enabled && (hour >= 22 || hour < 7)) {
      return Response.json({ skipped: true, reason: 'During quiet hours' });
    }

    // Create notification
    const notification = await base44.asServiceRole.entities.Notification.create({
      user_email: userEmail,
      type: reminderType,
      title,
      message,
      action_url: actionUrl,
      notification_time: new Date().toISOString()
    });

    console.log(`${reminderType} reminder sent to ${userEmail}`);
    return Response.json({ success: true, notificationId: notification.id });
  } catch (error) {
    console.error('Error sending weekly reminder:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});