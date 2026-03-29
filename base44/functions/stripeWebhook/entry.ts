import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

const PRICE_TO_PLAN = {
  'price_1TGBR1COuE09SydQb6vFoZEX': 'pro',
  'price_1TGBR1COuE09SydQUiKVWxEx': 'premium',
};

async function upsertUserSettings(base44, userEmail, data) {
  const existing = await base44.asServiceRole.entities.UserSettings.filter({ created_by: userEmail });
  if (existing.length > 0) {
    await base44.asServiceRole.entities.UserSettings.update(existing[0].id, data);
  } else {
    await base44.asServiceRole.entities.UserSettings.create({ ...data, created_by: userEmail });
  }
}

Deno.serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const base44 = createClientFromRequest(req);
  console.log('Stripe webhook event:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userEmail = session.metadata?.user_email;
        const planId = session.metadata?.plan_id;
        if (!userEmail) break;

        await upsertUserSettings(base44, userEmail, {
          subscription_plan: planId || 'pro',
          subscription_status: 'trialing',
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
        });
        console.log(`Subscription started for ${userEmail}: ${planId}`);
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const userEmail = sub.metadata?.user_email;
        if (!userEmail) break;

        const priceId = sub.items?.data[0]?.price?.id;
        const planId = PRICE_TO_PLAN[priceId] || 'free';
        const endDate = new Date(sub.current_period_end * 1000).toISOString().split('T')[0];

        await upsertUserSettings(base44, userEmail, {
          subscription_plan: planId,
          subscription_status: sub.status,
          stripe_subscription_id: sub.id,
          stripe_customer_id: sub.customer,
          subscription_end_date: endDate,
        });
        console.log(`Subscription updated for ${userEmail}: ${planId} / ${sub.status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const userEmail = sub.metadata?.user_email;
        if (!userEmail) break;

        await upsertUserSettings(base44, userEmail, {
          subscription_plan: 'free',
          subscription_status: 'inactive',
          stripe_subscription_id: null,
        });
        console.log(`Subscription cancelled for ${userEmail}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const sub = await stripe.subscriptions.retrieve(invoice.subscription);
        const userEmail = sub.metadata?.user_email;
        if (!userEmail) break;

        await upsertUserSettings(base44, userEmail, {
          subscription_status: 'past_due',
        });
        console.log(`Payment failed for ${userEmail}`);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        if (!invoice.subscription) break;
        const sub = await stripe.subscriptions.retrieve(invoice.subscription);
        const userEmail = sub.metadata?.user_email;
        if (!userEmail) break;

        const priceId = sub.items?.data[0]?.price?.id;
        const planId = PRICE_TO_PLAN[priceId] || 'pro';
        const endDate = new Date(sub.current_period_end * 1000).toISOString().split('T')[0];

        await upsertUserSettings(base44, userEmail, {
          subscription_plan: planId,
          subscription_status: 'active',
          subscription_end_date: endDate,
        });
        console.log(`Invoice paid for ${userEmail}: ${planId}`);
        break;
      }

      default:
        console.log(`Unhandled event: ${event.type}`);
    }
  } catch (err) {
    console.error('Error processing webhook:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }

  return Response.json({ received: true });
});