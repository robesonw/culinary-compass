import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      steps,
      activeCalories,
      restingCalories,
      sleepHours,
      restingHeartRate,
      bodyWeight,
      syncDate,
    } = await req.json();

    if (!syncDate) {
      return Response.json({ error: 'Sync date required' }, { status: 400 });
    }

    // Create or update WearableSync record
    const existingSync = await base44.asServiceRole.entities.WearableSync.filter({
      sync_date: syncDate,
      source: 'apple_health',
    });

    let syncRecord;
    if (existingSync && existingSync.length > 0) {
      syncRecord = await base44.asServiceRole.entities.WearableSync.update(
        existingSync[0].id,
        {
          steps: steps || existingSync[0].steps,
          active_calories: activeCalories || existingSync[0].active_calories,
          resting_calories: restingCalories || existingSync[0].resting_calories,
          sleep_hours: sleepHours || existingSync[0].sleep_hours,
          resting_heart_rate: restingHeartRate || existingSync[0].resting_heart_rate,
          body_weight: bodyWeight || existingSync[0].body_weight,
          synced_at: new Date().toISOString(),
        }
      );
    } else {
      syncRecord = await base44.asServiceRole.entities.WearableSync.create({
        sync_date: syncDate,
        source: 'apple_health',
        steps: steps || 0,
        active_calories: activeCalories || 0,
        resting_calories: restingCalories || 0,
        sleep_hours: sleepHours || 0,
        resting_heart_rate: restingHeartRate,
        body_weight: bodyWeight,
        synced_at: new Date().toISOString(),
      });
    }

    return Response.json({
      status: 'success',
      data: {
        steps,
        activeCalories,
        sleepHours,
        restingHeartRate,
        bodyWeight,
        syncedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error syncing Apple Health:', error.message);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});