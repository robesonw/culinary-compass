import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Calculate daily calorie adjustment based on activity level
 * Returns: { adjustment, reason, adjustedCalories }
 */
export function getCalorieAdjustment(steps, baseDailyCalories = 2000) {
  let adjustment = 0;
  let activityLevel = 'sedentary';
  let reason = '';

  if (steps >= 15000) {
    adjustment = 600;
    activityLevel = 'extremely_active';
    reason = `You took ${steps.toLocaleString()} steps today—extremely active! We added 600 calories to your target.`;
  } else if (steps >= 10000) {
    adjustment = 400;
    activityLevel = 'very_active';
    reason = `You took ${steps.toLocaleString()} steps today—very active! We added 400 calories to your target.`;
  } else if (steps >= 7500) {
    adjustment = 250;
    activityLevel = 'active';
    reason = `You took ${steps.toLocaleString()} steps today—active! We added 250 calories to your target.`;
  } else if (steps >= 5000) {
    adjustment = 150;
    activityLevel = 'lightly_active';
    reason = `You took ${steps.toLocaleString()} steps today—lightly active. We added 150 calories to your target.`;
  } else {
    adjustment = 0;
    activityLevel = 'sedentary';
    reason = `You took ${steps.toLocaleString()} steps today. No calorie adjustment made.`;
  }

  return {
    adjustment,
    activityLevel,
    reason,
    adjustedCalories: baseDailyCalories + adjustment,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { steps, baseDailyCalories = 2000 } = await req.json();

    if (steps === undefined) {
      return Response.json({ error: 'Steps required' }, { status: 400 });
    }

    const result = getCalorieAdjustment(steps, baseDailyCalories);

    return Response.json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    console.error('Error calculating adjusted calories:', error.message);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});