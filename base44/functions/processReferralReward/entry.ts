import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { format } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { referral_code, referred_email, action } = payload;

    if (!referral_code || !referred_email) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find the referral
    const referrals = await base44.entities.Referral.filter({
      referral_code: referral_code
    });

    if (referrals.length === 0) {
      return Response.json({ error: 'Referral not found' }, { status: 404 });
    }

    const referral = referrals[0];

    // Update referral based on action
    if (action === 'joined') {
      await base44.entities.Referral.update(referral.id, {
        referred_email: referred_email,
        status: 'joined',
        completed_date: format(new Date(), 'yyyy-MM-dd')
      });

      // Send notification to referrer
      try {
        await base44.integrations.Core.SendEmail({
          to: referral.referrer_email,
          subject: '🎉 Your friend joined VitaPlate!',
          body: `Great news! Your friend ${referred_email} just signed up using your referral link. You're one step closer to earning a free Pro month! They just need to upgrade to Pro to complete the reward.`
        });
      } catch (e) {
        console.error('Failed to send join notification:', e);
      }

      return Response.json({
        success: true,
        message: 'Referral marked as joined',
        notification_sent: true
      });
    }

    if (action === 'upgraded') {
      // Update referral status
      await base44.entities.Referral.update(referral.id, {
        status: 'upgraded',
        upgraded_date: format(new Date(), 'yyyy-MM-dd'),
        referrer_reward_status: 'applied',
        referred_reward_status: 'applied',
        reward_applied_date: format(new Date(), 'yyyy-MM-dd')
      });

      // Send reward notification to referrer
      try {
        await base44.integrations.Core.SendEmail({
          to: referral.referrer_email,
          subject: '🎁 You earned 1 month free Pro!',
          body: `Awesome! Your friend ${referred_email} just upgraded to Pro. You've both earned 1 month free Pro access! The credit has been applied to your account.`
        });
      } catch (e) {
        console.error('Failed to send referrer reward notification:', e);
      }

      // Send reward notification to referred user
      try {
        await base44.integrations.Core.SendEmail({
          to: referred_email,
          subject: '🎁 You earned 1 month free Pro!',
          body: `Welcome to VitaPlate Pro! As a referral bonus from your friend ${referral.referrer_email}, you've earned 1 month free Pro access. The credit has been applied to your account.`
        });
      } catch (e) {
        console.error('Failed to send referred user reward notification:', e);
      }

      return Response.json({
        success: true,
        message: 'Rewards applied to both users',
        notifications_sent: true
      });
    }

    return Response.json({
      error: 'Invalid action',
      status: 400
    });
  } catch (error) {
    console.error('Error processing referral reward:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});