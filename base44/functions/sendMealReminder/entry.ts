import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userEmail, mealType, reminderTime } = await req.json();

    // Get user notification settings
    const settings = await base44.asServiceRole.entities.NotificationSettings.filter({ 
      created_by: userEmail 
    });
    const userSettings = settings?.[0];

    // Check if meal reminders are enabled
    if (!userSettings?.meal_reminders) {
      return Response.json({ skipped: true, reason: 'Meal reminders disabled' });
    }

    // Check quiet hours
    const now = new Date();
    const hour = now.getHours();
    if (userSettings?.quiet_hours_enabled && (hour >= 22 || hour < 7)) {
      return Response.json({ skipped: true, reason: 'During quiet hours' });
    }

    // Check if meal was already logged today
    const today = now.toISOString().split('T')[0];
    const logs = await base44.asServiceRole.entities.NutritionLog.filter({
      created_by: userEmail,
      log_date: today,
      meal_type: mealType
    });

    if (logs.length > 0) {
      return Response.json({ skipped: true, reason: 'Meal already logged' });
    }

    // Create notification
    const mealEmoji = {
      breakfast: '🥞',
      lunch: '🍽️',
      dinner: '🍷'
    }[mealType] || '🍴';

    const notification = await base44.asServiceRole.entities.Notification.create({
      user_email: userEmail,
      type: 'meal_reminder',
      title: `${mealEmoji} Time to log ${mealType}!`,
      message: `Don't forget to log your ${mealType} to keep your nutrition tracking on track.`,
      action_url: '/NutritionTracking',
      notification_time: new Date().toISOString()
    });

    console.log(`Meal reminder sent to ${userEmail} for ${mealType}`);
    return Response.json({ success: true, notificationId: notification.id });
  } catch (error) {
    console.error('Error sending meal reminder:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});