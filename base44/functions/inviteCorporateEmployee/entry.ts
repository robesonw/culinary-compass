import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { corporateAccountId, employeeEmail, employeeName, department } = await req.json();

    if (!corporateAccountId || !employeeEmail) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user is corporate admin
    const corporateAccounts = await base44.asServiceRole.entities.CorporateAccount.filter({
      id: corporateAccountId,
      admin_email: user.email
    });

    if (corporateAccounts.length === 0) {
      return Response.json({ error: 'Unauthorized: Not corporate admin' }, { status: 403 });
    }

    const corporate = corporateAccounts[0];

    // Create employee record
    const employee = await base44.asServiceRole.entities.CorporateEmployee.create({
      corporate_account_id: corporateAccountId,
      employee_email: employeeEmail,
      employee_name: employeeName || employeeEmail,
      department: department || '',
      status: 'invited',
      invitation_sent_date: new Date().toISOString().split('T')[0]
    });

    // Send invitation email
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: employeeEmail,
      subject: `You're invited to VitaPlate - Wellness benefit from ${corporate.company_name}`,
      body: `
Hi ${employeeName || 'there'},

You're invited to join VitaPlate, a personalized nutrition platform. ${corporate.company_name} has provided this as a wellness benefit for all employees!

Complete your signup to get started: [signup_link]

Features included:
✓ AI-powered meal planning
✓ Nutrition coaching
✓ Lab tracking
✓ 10,000+ recipe library
✓ Health integrations

This access is fully paid by ${corporate.company_name} - no cost to you!

Get started: [signup_link]
      `
    });

    return Response.json({
      success: true,
      employee
    });
  } catch (error) {
    console.error('Invite employee error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});