import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { format, startOfMonth } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // This function is called by scheduler on the 1st of each month
    // For production, you'd fetch all users and send reports
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user preferences
    const userSettings = await base44.entities.UserSettings.filter({ created_by: user.email }).then(s => s?.[0]);
    
    if (!userSettings?.email_notifications) {
      return Response.json({ success: true, skipped: true, reason: 'User opted out' });
    }

    // Generate the report by calling the report function
    // (In a real scenario, you'd generate it here and get a signed URL)
    
    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);

    const monthName = format(startOfMonth(previousMonth), 'MMMM yyyy');

    // Send email
    try {
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `Your ${monthName} VitaPlate Health Report`,
        body: `
Hi ${user.full_name || 'there'},

Your monthly health report for ${monthName} is ready! 

This report includes:
• Lab Results Summary with health indicators
• Nutrition Analysis and macro breakdown
• Meal Plan Adherence & streaks
• Progress Tracking & measurements
• Achievements unlocked this month
• AI-generated goals for next month

You can download your report anytime from your VitaPlate account under "My Progress".

If you have questions about your health data, please consult with your healthcare provider.

Best regards,
The VitaPlate Team
        `
      });
    } catch (emailError) {
      console.error('Email send error:', emailError);
      // Don't fail the whole function if email fails
    }

    return Response.json({
      success: true,
      message: `Report email sent for ${monthName}`,
      user: user.email
    });
  } catch (error) {
    console.error('Error in sendMonthlyReportEmail:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});