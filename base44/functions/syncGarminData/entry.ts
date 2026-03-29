import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const GARMIN_API_BASE = 'https://healthapi.garmin.com/wellness-api/rest';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Garmin connection
    const connections = await base44.asServiceRole.entities.WearableConnection.filter({
      device_type: 'garmin',
      user_email: user.email,
      sync_status: 'active',
    });

    if (!connections || connections.length === 0) {
      return Response.json({ error: 'No active Garmin connection' }, { status: 404 });
    }

    const connection = connections[0];
    const today = new Date().toISOString().split('T')[0];

    try {
      // Fetch daily summary from Garmin Health API
      const summaryRes = await fetch(
        `${GARMIN_API_BASE}/dailySummaryStats?calendarDate=${today}`,
        {
          headers: {
            Authorization: `Bearer ${connection.oauth_access_token}`,
          },
        }
      );

      if (!summaryRes.ok) {
        throw new Error('Failed to fetch Garmin data');
      }

      const summaryData = await summaryRes.json();

      // Extract Garmin-specific metrics
      const steps = summaryData.steps || 0;
      const activeCalories = summaryData.activeCalories || 0;
      const restingCalories = summaryData.bmrCalories || 0;
      const restingHR = summaryData.restingHeartRate;
      const bodyBattery = summaryData.bodyBattery;
      const stressLevel = summaryData.stressLevel;

      // Calculate sleep hours if available
      let sleepHours = null;
      if (summaryData.sleepData) {
        sleepHours = summaryData.sleepData.totalSleepDuration / (1000 * 60 * 60);
      }

      // Create WearableSync record
      const syncRecord = await base44.asServiceRole.entities.WearableSync.create({
        sync_date: today,
        source: 'garmin',
        steps,
        active_calories: activeCalories,
        resting_calories: restingCalories,
        sleep_hours: sleepHours,
        resting_heart_rate: restingHR,
        body_battery: bodyBattery,
        stress_level: stressLevel,
        synced_at: new Date().toISOString(),
      });

      // Update connection last_sync
      await base44.asServiceRole.entities.WearableConnection.update(connection.id, {
        last_sync: new Date().toISOString(),
        sync_status: 'active',
      });

      console.log(`Garmin sync successful for ${user.email}`);

      return Response.json({
        success: true,
        data: {
          steps,
          active_calories: activeCalories,
          sleep_hours: sleepHours,
          body_battery: bodyBattery,
          stress_level: stressLevel,
        },
      });
    } catch (syncError) {
      console.error('Garmin sync error:', syncError);

      // Update connection with error
      await base44.asServiceRole.entities.WearableConnection.update(connection.id, {
        sync_status: 'error',
        sync_error: syncError.message,
      });

      return Response.json(
        { error: 'Garmin sync failed', details: syncError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Garmin sync handler error:', error);
    return Response.json(
      { error: error.message || 'Failed to sync Garmin data' },
      { status: 500 }
    );
  }
});