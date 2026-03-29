import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userEmail } = await req.json();

    // Get user notification settings
    const settings = await base44.asServiceRole.entities.NotificationSettings.filter({ 
      created_by: userEmail 
    });
    const userSettings = settings?.[0];

    // Check if lab reminders are enabled
    if (!userSettings?.lab_reminders) {
      return Response.json({ skipped: true, reason: 'Lab reminders disabled' });
    }

    // Check quiet hours
    const now = new Date();
    const hour = now.getHours();
    if (userSettings?.quiet_hours_enabled && (hour >= 22 || hour < 7)) {
      return Response.json({ skipped: true, reason: 'During quiet hours' });
    }

    // Check last lab upload
    const labResults = await base44.asServiceRole.entities.LabResult.filter({
      created_by: userEmail
    }, '-upload_date', 1);

    if (labResults.length === 0) {
      // No lab results, encourage to upload
      const notification = await base44.asServiceRole.entities.Notification.create({
        user_email: userEmail,
        type: 'lab_reminder',
        title: '🧬 Share your lab results',
        message: 'Upload your lab results to get personalized health insights and nutrition recommendations.',
        action_url: '/LabResults',
        notification_time: new Date().toISOString()
      });
      console.log(`Lab reminder sent to ${userEmail} (no previous results)`);
      return Response.json({ success: true, notificationId: notification.id });
    }

    // Check if it's been 90+ days
    const lastUploadDate = new Date(labResults[0].upload_date);
    const daysSinceUpload = Math.floor((now - lastUploadDate) / (1000 * 60 * 60 * 24));

    if (daysSinceUpload >= 90) {
      const notification = await base44.asServiceRole.entities.Notification.create({
        user_email: userEmail,
        type: 'lab_reminder',
        title: '🧬 Time for updated lab results',
        message: `It's been ${daysSinceUpload} days since your last lab upload. Refresh your results for updated recommendations.`,
        action_url: '/LabResults',
        notification_time: new Date().toISOString()
      });
      console.log(`Lab reminder sent to ${userEmail} (${daysSinceUpload} days since upload)`);
      return Response.json({ success: true, notificationId: notification.id });
    }

    return Response.json({ skipped: true, reason: 'Less than 90 days since last upload' });
  } catch (error) {
    console.error('Error sending lab reminder:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});