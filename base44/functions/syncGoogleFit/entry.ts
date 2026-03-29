import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accessToken, refreshToken } = await req.json();

    if (!accessToken) {
      return Response.json({ error: 'Access token required' }, { status: 400 });
    }

    // Get today's date range in milliseconds
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const timeRange = {
      startTimeMillis: startOfDay.getTime(),
      endTimeMillis: endOfDay.getTime(),
    };

    // Request aggregated daily data
    const response = await fetch(
      'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aggregateBy: [
            {
              dataTypeName: 'com.google.step_count.delta',
            },
            {
              dataTypeName: 'com.google.calories.expended',
            },
            {
              dataTypeName: 'com.google.heart_rate.bpm',
            },
            {
              dataTypeName: 'com.google.weight',
            },
            {
              dataTypeName: 'com.google.sleep.segment',
            },
          ],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis: timeRange.startTimeMillis,
          endTimeMillis: timeRange.endTimeMillis,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return Response.json(
        { error: 'Google Fit API error', details: error },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Parse aggregated data
    let steps = 0;
    let activeCalories = 0;
    let restingHeartRate = null;
    let weight = null;
    let sleepHours = 0;

    if (data.bucket && data.bucket.length > 0) {
      const bucket = data.bucket[0];

      // Steps
      if (bucket.dataset && bucket.dataset[0]) {
        const stepData = bucket.dataset[0];
        if (stepData.point && stepData.point.length > 0) {
          steps = stepData.point[0].value[0].intVal || 0;
        }
      }

      // Calories
      if (bucket.dataset && bucket.dataset[1]) {
        const caloriesData = bucket.dataset[1];
        if (caloriesData.point && caloriesData.point.length > 0) {
          activeCalories = Math.round(caloriesData.point[0].value[0].fpVal || 0);
        }
      }

      // Heart rate (average)
      if (bucket.dataset && bucket.dataset[2]) {
        const heartRateData = bucket.dataset[2];
        if (heartRateData.point && heartRateData.point.length > 0) {
          const heartRates = heartRateData.point.map((p) => p.value[0].fpVal);
          restingHeartRate = Math.round(
            heartRates.reduce((a, b) => a + b, 0) / heartRates.length
          );
        }
      }

      // Weight (latest)
      if (bucket.dataset && bucket.dataset[3]) {
        const weightData = bucket.dataset[3];
        if (weightData.point && weightData.point.length > 0) {
          weight = weightData.point[0].value[0].fpVal;
        }
      }

      // Sleep
      if (bucket.dataset && bucket.dataset[4]) {
        const sleepData = bucket.dataset[4];
        if (sleepData.point && sleepData.point.length > 0) {
          const sleepMillis = sleepData.point.reduce(
            (total, p) => total + (p.value[0].intVal || 0),
            0
          );
          sleepHours = sleepMillis / (1000 * 60 * 60);
        }
      }
    }

    // Create WearableSync record
    const syncRecord = await base44.asServiceRole.entities.WearableSync.create({
      sync_date: startOfDay.toISOString().split('T')[0],
      source: 'google_fit',
      steps: Math.round(steps),
      active_calories: activeCalories,
      resting_heart_rate: restingHeartRate,
      body_weight: weight ? weight : undefined,
      sleep_hours: Math.round(sleepHours * 10) / 10,
      synced_at: new Date().toISOString(),
    });

    // Log successful sync
    await base44.asServiceRole.entities.ReminderLog.create({
      user_email: user.email,
      reminder_type: 'activity_sync',
      reminder_date: startOfDay.toISOString().split('T')[0],
      was_sent: true,
      sent_at: new Date().toISOString(),
    });

    return Response.json({
      status: 'success',
      data: {
        steps,
        activeCalories,
        restingHeartRate,
        weight,
        sleepHours: Math.round(sleepHours * 10) / 10,
        syncedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error syncing Google Fit:', error.message);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});