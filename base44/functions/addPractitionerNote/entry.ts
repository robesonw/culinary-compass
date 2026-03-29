import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clientEmail, note, noteType, relatedTo } = await req.json();

    if (!clientEmail || !note) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const practitionerNote = await base44.entities.PractitionerNote.create({
      practitioner_email: user.email,
      client_email: clientEmail,
      note: note,
      note_type: noteType || 'general',
      created_date: new Date().toISOString().split('T')[0],
      related_to: relatedTo
    });

    return Response.json({
      success: true,
      note: practitionerNote
    });
  } catch (error) {
    console.error('Add note error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});