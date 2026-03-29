import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Helper function to get all active users and send notifications
async function getAllActiveUsers(base44) {
  try {
    // Get all users who have created meal plans or logged meals
    const mealPlans = await base44.asServiceRole.entities.MealPlan.list('-created_date', 1000);
    const uniqueUsers = new Set(mealPlans.map(p => p.created_by).filter(Boolean));
    return Array.from(uniqueUsers);
  } catch (error) {
    console.error('Error getting active users:', error);
    return [];
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { reminderType, mealType } = await req.json();

    // Get all active users
    const users = await getAllActiveUsers(base44);
    console.log(`Processing ${reminderType} for ${users.length} users`);

    const results = {
      total: users.length,
      sent: 0,
      skipped: 0,
      errors: 0
    };

    // Send reminder to each user
    for (const userEmail of users) {
      try {
        let payload = { userEmail };
        
        if (mealType) {
          payload.mealType = mealType;
        }
        if (reminderType === 'weekly_plan') {
          payload.reminderType = 'weekly_plan';
        } else if (reminderType === 'weekly_digest') {
          payload.reminderType = 'weekly_digest';
        } else if (reminderType === 'goal_checkin') {
          payload.reminderType = 'goal_checkin';
        }

        // Call appropriate function based on reminder type
        let functionName = 'sendMealReminder';
        if (reminderType === 'streak_alert') {
          functionName = 'sendStreakAlert';
        } else if (reminderType?.includes('weekly')) {
          functionName = 'sendWeeklyReminders';
        } else if (reminderType === 'lab') {
          functionName = 'sendLabReminder';
        }

        const response = await base44.asServiceRole.functions.invoke(functionName, payload);
        
        if (response?.skipped) {
          results.skipped++;
        } else if (response?.success) {
          results.sent++;
        }
      } catch (error) {
        console.error(`Error processing reminder for ${userEmail}:`, error);
        results.errors++;
      }
    }

    console.log(`${reminderType} batch results:`, results);
    return Response.json(results);
  } catch (error) {
    console.error('Error in sendUserNotifications:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});