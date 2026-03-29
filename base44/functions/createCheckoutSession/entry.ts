import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

const PRICE_IDS = {
  pro: 'price_1TGCf5COuE09SydQyobbRxyt',       // $9.99/month
  premium: 'price_1TGCf5COuE09SydQ6IYtFCws',   // $19.99/month
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { plan_id } = await req.json();
    const priceId = PRICE_IDS[plan_id];
    if (!priceId) return Response.json({ error: 'Invalid plan' }, { status: 400 });

    const origin = req.headers.get('origin') || 'https://vitaplate.base44.app';

    // Get or create Stripe customer
    const settings = await base44.entities.UserSettings.filter({ created_by: user.email });
    let customerId = settings[0]?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: { user_email: user.email },
      });
      customerId = customer.id;
      // Persist the new customer ID so future sessions reuse it
      const customerData = { stripe_customer_id: customerId };
      if (settings.length > 0) {
        await base44.entities.UserSettings.update(settings[0].id, customerData);
      } else {
        await base44.entities.UserSettings.create(customerData);
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/Pricing?success=true&plan=${plan_id}`,
      cancel_url: `${origin}/Pricing?cancelled=true`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        user_email: user.email,
        plan_id,
      },
      subscription_data: {
        trial_period_days: 7,
        metadata: { user_email: user.email, plan_id },
      },
    });

    console.log(`Checkout session created for ${user.email}: ${session.id}`);
    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});