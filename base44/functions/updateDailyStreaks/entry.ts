import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Get or create user streak record
    let streak = await base44.entities.UserStreak.filter({ created_by: user.email }).then(results => results[0]);

    if (!streak) {
      streak = await base44.entities.UserStreak.create({
        meal_log_streak: 0,
        checkin_streak: 0,
        plan_follow_streak: 0,
        longest_streak: 0,
        total_days_logged: 0,
        shields_remaining: 0,
        shields_earned: 0
      });
    }

    const lastActivityDate = streak.last_activity_date;
    const isNewDay = !lastActivityDate || lastActivityDate !== today;

    if (!isNewDay) {
      return Response.json({ message: 'Already tracked today', streak });
    }

    // Check if a day was missed (streak reset logic)
    let mealLogStreak = streak.meal_log_streak;
    let checkinStreak = streak.checkin_streak;
    let planFollowStreak = streak.plan_follow_streak;
    let shieldsUsed = false;

    if (lastActivityDate) {
      const lastDate = new Date(lastActivityDate);
      const todayDate = new Date(today);
      const daysDiff = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

      // If more than 1 day missed, check for shield usage
      if (daysDiff > 1) {
        if (streak.shields_remaining > 0) {
          // Use a shield to preserve streaks
          shieldsUsed = true;
          const newShields = streak.shields_remaining - 1;

          await base44.entities.UserStreak.update(streak.id, {
            shields_remaining: newShields,
            last_shield_used_date: today
          });

          // Notify user
          await base44.integrations.Core.SendEmail({
            to: user.email,
            subject: '🛡️ Streak Shield Used!',
            body: `Your streak shield protected your streaks today! You have ${newShields} shield(s) remaining.\n\nKeep logging to earn more shields every 7 days!`
          });

          return Response.json({ message: 'Shield used to protect streaks', shield_used: true, shield_remaining: newShields });
        } else {
          // Streaks reset
          mealLogStreak = 0;
          checkinStreak = 0;
          planFollowStreak = 0;
        }
      }
    }

    // Update longest streak tracking
    const maxCurrentStreak = Math.max(mealLogStreak, checkinStreak, planFollowStreak);
    const newLongestStreak = Math.max(streak.longest_streak || 0, maxCurrentStreak);

    await base44.entities.UserStreak.update(streak.id, {
      meal_log_streak: mealLogStreak,
      checkin_streak: checkinStreak,
      plan_follow_streak: planFollowStreak,
      longest_streak: newLongestStreak,
      last_activity_date: today,
      total_days_logged: (streak.total_days_logged || 0) + 1
    });

    return Response.json({
      message: 'Streaks updated successfully',
      shield_used: shieldsUsed,
      streak_reset: mealLogStreak === 0 && !shieldsUsed
    });
  } catch (error) {
    console.error('Error updating streaks:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});