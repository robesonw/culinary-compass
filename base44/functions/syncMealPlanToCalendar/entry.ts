import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const MEAL_COLORS = {
  breakfast: 5,  // Yellow
  lunch: 2,      // Green
  dinner: 4,     // Blue
  snacks: 6,     // Orange
};

const MEAL_DURATIONS = {
  breakfast: 30,
  lunch: 45,
  dinner: 45,
  snacks: 30,
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { meal_plan_id, meal_times } = await req.json();

    if (!meal_plan_id || !meal_times) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get meal plan
    const mealPlan = await base44.asServiceRole.entities.MealPlan.list();
    const plan = mealPlan.find(p => p.id === meal_plan_id);

    if (!plan) {
      return Response.json({ error: 'Meal plan not found' }, { status: 404 });
    }

    // Get access token
    const accessToken = await base44.asServiceRole.connectors.getCurrentAppUserAccessToken('google_calendar_connector');

    // Get the start date of the plan
    const startDate = new Date(plan.start_date);
    const eventIds = [];

    // Create meal events
    for (let dayIndex = 0; dayIndex < plan.days.length; dayIndex++) {
      const day = plan.days[dayIndex];
      const eventDate = new Date(startDate);
      eventDate.setDate(eventDate.getDate() + dayIndex);

      // Create event for each meal type
      for (const mealType of ['breakfast', 'lunch', 'dinner', 'snacks']) {
        const meal = day[mealType];
        if (!meal || !meal.name) continue;

        const time = meal_times[mealType];
        const [hours, minutes] = time.split(':');

        const eventStart = new Date(eventDate);
        eventStart.setHours(parseInt(hours), parseInt(minutes), 0);

        const eventEnd = new Date(eventStart);
        eventEnd.setMinutes(eventEnd.getMinutes() + MEAL_DURATIONS[mealType]);

        // Build description with ingredients and macros
        const description = [
          `${mealType.toUpperCase()}: ${meal.name}`,
          '',
          'MACRONUTRIENTS:',
          `Calories: ${meal.calories || '—'}`,
          `Protein: ${meal.protein || '—'}g`,
          `Carbs: ${meal.carbs || '—'}g`,
          `Fat: ${meal.fat || '—'}g`,
          '',
          meal.prepTip ? `TIP: ${meal.prepTip}` : '',
          '',
          meal.prepSteps ? `PREP STEPS:\n${meal.prepSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}` : '',
        ].filter(Boolean).join('\n');

        const event = {
          summary: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)}: ${meal.name}`,
          description,
          start: {
            dateTime: eventStart.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          end: {
            dateTime: eventEnd.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          colorId: MEAL_COLORS[mealType],
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'notification', minutes: 15 },
            ],
          },
        };

        const response = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(event),
          }
        );

        if (!response.ok) {
          const errorData = await response.text();
          console.error('Google Calendar API error:', errorData);
          throw new Error(`Failed to create calendar event: ${response.status}`);
        }

        const createdEvent = await response.json();
        eventIds.push(createdEvent.id);
      }
    }

    // Create meal prep event for Sunday
    const nextSunday = new Date(startDate);
    nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()));
    nextSunday.setHours(16, 0, 0);

    const mealPrepEnd = new Date(nextSunday);
    mealPrepEnd.setHours(17, 0, 0);

    // Generate grocery list from all meals
    const allIngredients = plan.days.flatMap(day => {
      const meals = [day.breakfast, day.lunch, day.dinner, day.snacks].filter(Boolean);
      return meals.map(m => m.name).filter(Boolean);
    });

    const mealPrepEvent = {
      summary: 'Meal Prep for the Week – VitaPlate',
      description: `Prepare for the week ahead!\n\nPlanned meals:\n${allIngredients.join('\n')}`,
      start: {
        dateTime: nextSunday.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: mealPrepEnd.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      colorId: 1,
    };

    const prepResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mealPrepEvent),
      }
    );

    if (prepResponse.ok) {
      const prepEvent = await prepResponse.json();
      eventIds.push(prepEvent.id);
    }

    // Save sync record
    await base44.asServiceRole.entities.CalendarSync.create({
      user_email: user.email,
      meal_plan_id,
      calendar_event_ids: eventIds,
      sync_date: new Date().toISOString().split('T')[0],
      meal_times,
      auto_sync_enabled: false,
    });

    return Response.json({
      success: true,
      eventCount: eventIds.length,
      message: `Synced ${eventIds.length} events to Google Calendar`,
    });
  } catch (error) {
    console.error('Sync error:', error);
    return Response.json(
      { error: error.message || 'Failed to sync meal plan' },
      { status: 500 }
    );
  }
});