import { createClient } from '@supabase/supabase-js';
import { requireAdminSession } from '../../../../../lib/auth/requireAdminSession';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function PATCH(request, { params }) {
  const session = await requireAdminSession();
  if (!session.authenticated) {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { id } = params;
    const { addedBy, sentTo, coordinator, profession, placement, status } = await request.json();

    // Validate input
    if (
      addedBy === undefined &&
      sentTo === undefined &&
      coordinator === undefined &&
      profession === undefined &&
      placement === undefined &&
      status === undefined
    ) {
      return Response.json(
        { error: 'At least one field (addedBy, sentTo, coordinator, profession, placement, status) must be provided' },
        { status: 400 }
      );
    }

    // Prepare update object
    const updateData = {};
    if (addedBy !== undefined) updateData.addedBy = addedBy || null;
    if (sentTo !== undefined) updateData.sentTo = sentTo || null;
    if (coordinator !== undefined) updateData.coordinator = coordinator || null;
    if (profession !== undefined) updateData.profession = profession || null;
    if (placement !== undefined) updateData.placement = placement || null;
    if (status !== undefined) updateData.status = status || null;

    // Update submission
    const { data, error } = await supabase
      .from('submissions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return Response.json(
        { error: 'Failed to update submission' },
        { status: 500 }
      );
    }

    if (!data) {
      return Response.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
