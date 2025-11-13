import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../../../../../../lib/services/supabase-server';
import { requireAdminSession } from '../../../../../../lib/auth/requireAdminSession';

const BUCKET = 'cv-photos';

function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function GET(_req, { params }) {
  const session = await requireAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const submissionId = params?.id;
  if (!submissionId) {
    return NextResponse.json({ error: 'Missing submission id' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('submission_id', submissionId)
      .order('paid_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching payments:', error);
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error('GET /payments error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const session = await requireAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const submissionId = params?.id;
  if (!submissionId) {
    return NextResponse.json({ error: 'Missing submission id' }, { status: 400 });
  }

  try {
    const formData = await request.formData();
    const paidAt = formData.get('paid_at');
    const amountStr = formData.get('amount_rupiah');
    const paymentFor = formData.get('payment_for');
    const proof = formData.get('proof');

    if (!paidAt || !amountStr || !paymentFor || !proof) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const amount = parseInt(String(amountStr).replace(/\D/g, ''), 10);
    if (!Number.isFinite(amount) || amount < 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(proof.type)) {
      return NextResponse.json({ error: 'Proof must be an image (jpg, jpeg, png, webp)' }, { status: 400 });
    }
    if (proof.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    // Upload proof
    const adminStorage = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const ext = proof.name?.split('.').pop() || 'jpg';
    const baseName = sanitizeFileName(proof.name?.replace(/\.[^.]+$/, '') || 'proof');
    const key = `payments/${submissionId}/${Date.now()}_${baseName}.${ext}`;

    const { error: uploadError } = await adminStorage.storage
      .from(BUCKET)
      .upload(key, proof, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload proof' }, { status: 500 });
    }

    const { data: pub } = adminStorage.storage.from(BUCKET).getPublicUrl(key);
    const proofUrl = pub?.publicUrl;

    // Insert payment
    const { data, error } = await supabase
      .from('payments')
      .insert([
        {
          submission_id: submissionId,
          paid_at: new Date(paidAt).toISOString(),
          amount_rupiah: amount,
          payment_for: paymentFor,
          proof_url: proofUrl,
          proof_storage_key: key,
          created_by: session.adminUserId,
          updated_by: session.adminUserId,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error inserting payment:', error);
      return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('POST /payments error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

