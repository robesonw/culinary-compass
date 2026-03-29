import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clientEmail, planName, planDetails, duration, notes } = await req.json();

    if (!clientEmail || !planName) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create the meal plan
    const mealPlan = await base44.asServiceRole.entities.MealPlan.create({
      name: planName,
      description: notes || '',
      duration: duration || '1 week',
      created_by: user.email,
      ...planDetails
    });

    // Update the client's current meal plan
    const clients = await base44.asServiceRole.entities.PractitionerClient.filter({
      practitioner_email: user.email,
      client_email: clientEmail
    });

    if (clients.length > 0) {
      await base44.asServiceRole.entities.PractitionerClient.update(clients[0].id, {
        current_meal_plan_id: mealPlan.id
      });
    }

    // Create a notification for the client
    await base44.asServiceRole.entities.Notification.create({
      recipient_email: clientEmail,
      type: 'meal_plan_created',
      title: 'New Meal Plan Created',
      message: `Your nutritionist ${user.full_name} has created a new meal plan for you: "${planName}"`,
      action_url: '/MealPlans',
      read: false
    });

    return Response.json({
      success: true,
      meal_plan_id: mealPlan.id,
      plan: mealPlan
    });
  } catch (error) {
    console.error('Create meal plan error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});