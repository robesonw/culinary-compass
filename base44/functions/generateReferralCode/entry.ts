import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has a referral code
    const existingReferrals = await base44.entities.Referral.filter({
      referrer_email: user.email
    });

    if (existingReferrals.length > 0 && existingReferrals[0].referral_code) {
      return Response.json({
        success: true,
        referral_code: existingReferrals[0].referral_code
      });
    }

    // Generate unique code
    const code = generateUniqueCode();

    // Create referral record
    await base44.entities.Referral.create({
      referrer_email: user.email,
      referral_code: code,
      status: 'pending'
    });

    return Response.json({
      success: true,
      referral_code: code
    });
  } catch (error) {
    console.error('Error generating referral code:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateUniqueCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'VP-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}