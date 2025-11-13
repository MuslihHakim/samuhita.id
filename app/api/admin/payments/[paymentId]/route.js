import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../../../../../lib/services/supabase-server';
import { requireAdminSession } from '../../../../../lib/auth/requireAdminSession';

const BUCKET = 'cv-photos';

export async function DELETE(_req, { params }) {
  const session = await requireAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const paymentId = params?.paymentId;
  if (!paymentId) {
    return NextResponse.json({ error: 'Missing payment id' }, { status: 400 });
  }

  try {
    // Fetch payment to get storage key
    const { data: payment, error: fetchErr } = await supabase
      .from('payments')
      .select('id, proof_storage_key')
      .eq('id', paymentId)
      .single();

    if (fetchErr && fetchErr.code !== 'PGRST116') {
      console.error('Error fetching payment:', fetchErr);
    }

    // Attempt storage removal if key exists
    if (payment?.proof_storage_key) {
      const adminStorage = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
      const { error: removeError } = await adminStorage.storage.from(BUCKET).remove([payment.proof_storage_key]);
      if (removeError) {
        console.warn('Failed to remove storage object:', removeError);
      }
    }

    // Delete DB row
    const { error: delErr } = await supabase
      .from('payments')
      .delete()
      .eq('id', paymentId);

    if (delErr) {
      console.error('Error deleting payment row:', delErr);
      return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /payments/:id error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

