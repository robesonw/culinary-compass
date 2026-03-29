import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_name, seat_count, employee_count } = await req.json();

    if (!company_name || !seat_count) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Determine pricing tier
    let pricePerSeat;
    if (seat_count >= 200) {
      return Response.json({
        error: 'custom_pricing',
        message: 'Contact sales for 200+ employee pricing'
      }, { status: 400 });
    } else if (seat_count >= 50) {
      pricePerSeat = 500; // $5/month in cents
    } else {
      pricePerSeat = 700; // $7/month in cents
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `VitaPlate Corporate - ${company_name}`,
              description: `${seat_count} employee licenses`
            },
            unit_amount: pricePerSeat,
            recurring: {
              interval: 'month'
            }
          },
          quantity: seat_count
        }
      ],
      success_url: `${Deno.env.get('APP_URL')}/CorporateAdmin?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get('APP_URL')}/CorporateSignup`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        company_name,
        seat_count,
        plan_type: 'corporate'
      }
    });

    return Response.json({
      success: true,
      checkout_url: session.url
    });
  } catch (error) {
    console.error('Corporate checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});