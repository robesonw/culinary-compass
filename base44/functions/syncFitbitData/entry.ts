import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const FITBIT_API_BASE = 'https://api.fitbit.com/1/user/-';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Fitbit connection
    const connections = await base44.asServiceRole.entities.WearableConnection.filter({
      device_type: 'fitbit',
      user_email: user.email,
      sync_status: 'active',
    });

    if (!connections || connections.length === 0) {
      return Response.json({ error: 'No active Fitbit connection' }, { status: 404 });
    }

    const connection = connections[0];
    const today = new Date().toISOString().split('T')[0];

    try {
      // Fetch activity data
      const activityRes = await fetch(`${FITBIT_API_BASE}/activities/date/${today}.json`, {
        headers: {
          Authorization: `Bearer ${connection.oauth_access_token}`,
        },
      });

      if (!activityRes.ok) {
        throw new Error('Failed to fetch Fitbit activity data');
      }

      const activityData = await activityRes.json();
      const summary = activityData.summary || {};

      // Fetch heart rate
      const hrRes = await fetch(`${FITBIT_API_BASE}/activities/heart/date/${today}/1d.json`, {
        headers: {
          Authorization: `Bearer ${connection.oauth_access_token}`,
        },
      });

      const hrData = hrRes.ok ? await hrRes.json() : null;
      const restingHR = hrData?.activities?.[0]?.value?.restingHeartRate;

      // Fetch sleep
      const sleepRes = await fetch(`${FITBIT_API_BASE}/sleep/date/${today}.json`, {
        headers: {
          Authorization: `Bearer ${connection.oauth_access_token}`,
        },
      });

      const sleepData = sleepRes.ok ? await sleepRes.json() : null;
      const sleepDuration = sleepData?.sleep?.[0]?.duration
        ? sleepData.sleep[0].duration / (1000 * 60 * 60)
        : null;

      // Create WearableSync record
      const syncRecord = await base44.asServiceRole.entities.WearableSync.create({
        sync_date: today,
        source: 'fitbit',
        steps: summary.steps || 0,
        active_calories: summary.activityCalories || 0,
        resting_calories: summary.caloriesBMR || 0,
        sleep_hours: sleepDuration,
        resting_heart_rate: restingHR,
        synced_at: new Date().toISOString(),
      });

      // Update connection last_sync
      await base44.asServiceRole.entities.WearableConnection.update(connection.id, {
        last_sync: new Date().toISOString(),
        sync_status: 'active',
      });

      console.log(`Fitbit sync successful for ${user.email}`);

      return Response.json({
        success: true,
        data: {
          steps: summary.steps,
          active_calories: summary.activityCalories,
          sleep_hours: sleepDuration,
          resting_heart_rate: restingHR,
        },
      });
    } catch (syncError) {
      console.error('Fitbit sync error:', syncError);

      // Update connection with error
      await base44.asServiceRole.entities.WearableConnection.update(connection.id, {
        sync_status: 'error',
        sync_error: syncError.message,
      });

      return Response.json(
        { error: 'Fitbit sync failed', details: syncError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Fitbit sync handler error:', error);
    return Response.json(
      { error: error.message || 'Failed to sync Fitbit data' },
      { status: 500 }
    );
  }
});