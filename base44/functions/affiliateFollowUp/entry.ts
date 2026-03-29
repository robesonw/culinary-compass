import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Scheduled function to send follow-up notifications 2 days after affiliate clicks
 * Run this daily to check for any click events that need follow-up
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all affiliate clicks from 2 days ago that haven't been followed up
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

    const clicks = await base44.asServiceRole.entities.AffiliateClick.filter({
      follow_up_sent: false,
      created_date: twoDaysAgoStr
    });

    let followUpCount = 0;

    for (const click of clicks) {
      try {
        // Update the click record to mark follow-up as sent
        await base44.asServiceRole.entities.AffiliateClick.update(click.id, {
          follow_up_sent: true,
          follow_up_date: new Date().toISOString().split('T')[0]
        });

        // Create a notification for the user
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: user.email,
          type: 'order_follow_up',
          title: '📦 Did your order arrive?',
          message: `We'd love to know if your ${click.affiliate_type === 'instacart' ? 'Instacart' : 'Amazon Fresh'} order arrived! Your feedback helps us improve.`,
          action_url: `/progress-tracking?show_feedback=true&affiliate_click_id=${click.id}`,
          is_read: false
        });

        followUpCount++;
      } catch (error) {
        console.error(`Error processing follow-up for click ${click.id}:`, error);
      }
    }

    return Response.json({
      success: true,
      followUpsSent: followUpCount,
      message: `Sent ${followUpCount} follow-up notifications`
    });
  } catch (error) {
    console.error('Affiliate follow-up error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});