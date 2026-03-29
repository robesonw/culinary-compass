import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const BADGE_RULES = [
  {
    id: 'first_flame',
    name: 'First Flame',
    emoji: '🔥',
    desc: 'Log your first day',
    check: (data) => data.total_days_logged >= 1
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    emoji: '⭐',
    desc: '7-day streak',
    check: (data) => Math.max(data.meal_log_streak, data.checkin_streak, data.plan_follow_streak) >= 7
  },
  {
    id: 'diamond_habit',
    name: 'Diamond Habit',
    emoji: '💎',
    desc: '30-day streak',
    check: (data) => data.longest_streak >= 30
  },
  {
    id: 'lab_legend',
    name: 'Lab Legend',
    emoji: '🧬',
    desc: 'Upload lab results',
    check: async (data, base44, user) => {
      const labs = await base44.entities.LabResult.filter({ created_by: user.email });
      return labs && labs.length > 0;
    }
  },
  {
    id: 'plan_follower',
    name: 'Plan Follower',
    emoji: '🥗',
    desc: '5-day plan streak',
    check: (data) => data.plan_follow_streak >= 5
  },
  {
    id: 'swapper',
    name: 'Swapper',
    emoji: '🔄',
    desc: 'Use 10 meal swaps',
    check: async (data, base44, user) => {
      // This would require tracking meal swaps in a new entity or metadata
      return data.total_swaps >= 10;
    }
  },
  {
    id: 'coach_pet',
    name: "Coach's Pet",
    emoji: '💬',
    desc: 'Ask 20 AI questions',
    check: async (data, base44, user) => {
      const messages = await base44.entities.CoachMessage.filter({ created_by: user.email });
      return messages && messages.filter(m => m.role === 'user').length >= 20;
    }
  },
  {
    id: 'smart_shopper',
    name: 'Smart Shopper',
    emoji: '🛒',
    desc: '4 weeks of grocery lists',
    check: async (data, base44, user) => {
      const lists = await base44.entities.GroceryList.filter({ created_by: user.email });
      // Check if created over 4+ weeks
      if (!lists || lists.length === 0) return false;
      const oldestList = lists[lists.length - 1];
      const weeksAgo = Math.floor((Date.now() - new Date(oldestList.created_date)) / (7 * 24 * 60 * 60 * 1000));
      return weeksAgo >= 4;
    }
  },
  {
    id: 'score_climber',
    name: 'Score Climber',
    emoji: '📈',
    desc: '+10 point health boost',
    check: (data) => data.health_score_improvement >= 10
  },
  {
    id: 'referral_pro',
    name: 'Referral Pro',
    emoji: '🤝',
    desc: 'Refer 3 friends',
    check: async (data, base44, user) => {
      const referrals = await base44.entities.Referral.filter({ 
        referrer_email: user.email,
        status: 'completed'
      });
      return referrals && referrals.length >= 3;
    }
  }
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const streakData = payload.streakData || {};

    // Get existing badges
    const existingBadges = await base44.entities.UserBadge.filter({ 
      created_by: user.email 
    });

    const badgeMap = {};
    existingBadges.forEach(badge => {
      badgeMap[badge.badge_id] = badge;
    });

    const newBadgesEarned = [];

    // Check each badge rule
    for (const rule of BADGE_RULES) {
      const already_earned = badgeMap[rule.id]?.is_earned;

      if (!already_earned) {
        let isEarned = false;

        try {
          if (typeof rule.check === 'function') {
            isEarned = rule.check.length > 1 
              ? await rule.check(streakData, base44, user)
              : rule.check(streakData);
          }
        } catch (err) {
          console.error(`Error checking badge ${rule.id}:`, err);
        }

        if (isEarned) {
          // Award badge
          if (badgeMap[rule.id]) {
            // Update existing badge record
            await base44.entities.UserBadge.update(badgeMap[rule.id].id, {
              is_earned: true,
              earned_date: new Date().toISOString().split('T')[0]
            });
          } else {
            // Create new badge record
            await base44.entities.UserBadge.create({
              badge_id: rule.id,
              badge_name: rule.name,
              badge_emoji: rule.emoji,
              description: rule.desc,
              is_earned: true,
              earned_date: new Date().toISOString().split('T')[0],
              progress: 100
            });
          }

          newBadgesEarned.push({ ...rule, is_earned: true });

          // Send email notification
          await base44.integrations.Core.SendEmail({
            to: user.email,
            subject: `🎉 Badge Earned: ${rule.emoji} ${rule.name}`,
            body: `Congratulations! You've earned the "${rule.name}" badge!\n\n${rule.desc}`
          });
        }
      }
    }

    return Response.json({
      message: 'Badge check complete',
      new_badges: newBadgesEarned,
      count: newBadgesEarned.length
    });
  } catch (error) {
    console.error('Error checking badges:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});