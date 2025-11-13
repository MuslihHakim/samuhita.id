import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/services/supabase-server';
import { lookupAuthUsersByEmails } from '../../../lib/services/admin';
import {
  handleSubmissionUserIdColumnError,
  isSubmissionUserIdColumnAvailable,
} from '../../../lib/services/submissionsUserIdColumn';
import { addToGoogleSheet } from '../../../lib/google-sheets';
import { requireAdminSession } from '../../../lib/auth/requireAdminSession';

export async function POST(request) {
  try {
    const body = await request.json();
    const { fullName, email, phoneNumber } = body;

    if (!fullName || !email || !phoneNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: existingSubmissions, error: checkError } = await supabase
      .from('submissions')
      .select('email, phoneNumber, status')
      .or(`email.eq.${email},phoneNumber.eq.${phoneNumber}`);

    if (checkError) {
      console.error('Error checking existing submissions:', checkError);
      return NextResponse.json(
        { error: 'Failed to validate submission' },
        { status: 500 }
      );
    }

    if (existingSubmissions && existingSubmissions.length > 0) {
      const existingEmail = existingSubmissions.find(sub => sub.email === email);
      const existingPhone = existingSubmissions.find(sub => sub.phoneNumber === phoneNumber);

      if (existingEmail && existingPhone) {
        return NextResponse.json(
          {
            error: 'Email dan nomor telepon sudah terdaftar. Silakan gunakan data yang berbeda atau hubungi admin jika ini adalah kesalahan.',
            existingEmail: true,
            existingPhone: true
          },
          { status: 409 }
        );
      } else if (existingEmail) {
        return NextResponse.json(
          {
            error: 'Email sudah terdaftar. Silakan gunakan email yang berbeda atau hubungi admin jika ini adalah kesalahan.',
            existingEmail: true,
            existingPhone: false
          },
          { status: 409 }
        );
      } else if (existingPhone) {
        return NextResponse.json(
          {
            error: 'Nomor telepon sudah terdaftar. Silakan gunakan nomor yang berbeda atau hubungi admin jika ini adalah kesalahan.',
            existingEmail: false,
            existingPhone: true
          },
          { status: 409 }
        );
      }
    }

    const { data, error } = await supabase
      .from('submissions')
      .insert([{
        fullName,
        email,
        phoneNumber,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save submission' },
        { status: 500 }
      );
    }

    await addToGoogleSheet({ fullName, email, phoneNumber });

    return NextResponse.json({
      success: true,
      message: 'Registration submitted successfully',
      data
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await requireAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      );
    }

    let submissions = data || [];

    const registeredWithoutUserId = submissions.filter(
      (submission) =>
        submission.status === 'registered' &&
        !submission.userId &&
        typeof submission.email === 'string' &&
        submission.email.trim().length > 0,
    );

    if (registeredWithoutUserId.length > 0) {
      const lookup = await lookupAuthUsersByEmails(
        registeredWithoutUserId.map((submission) => submission.email),
      );

      if (lookup.status === 200) {
        const emailToUser = lookup.body;
        const updates = [];

        for (const submission of registeredWithoutUserId) {
          const normalizedEmail = submission.email.trim().toLowerCase();
          const user = emailToUser.get(normalizedEmail);
          if (user?.id) {
            submission.userId = user.id;
            updates.push({ submissionId: submission.id, userId: user.id });
          }
        }

        if (updates.length > 0 && isSubmissionUserIdColumnAvailable()) {
          for (const update of updates) {
            const { error: updateError } = await supabase
              .from('submissions')
              .update({ userId: update.userId })
              .eq('id', update.submissionId);

            if (updateError) {
              if (!handleSubmissionUserIdColumnError(updateError, 'submissionsRoute.GET')) {
                console.error('Failed to backfill submission userIds:', updateError);
              }

              if (!isSubmissionUserIdColumnAvailable()) {
                break;
              }
            }
          }
        }
      } else {
        console.error(
          'Failed to lookup auth users for submissions:',
          lookup.body?.error,
        );
      }
    }

    if (submissions.length > 0) {
      const submissionIds = submissions
        .map((submission) => submission.id)
        .filter((id) => typeof id === 'string' && id.trim().length > 0);

      if (submissionIds.length > 0) {
        const {
          data: payments,
          error: paymentsError,
        } = await supabase
          .from('payments')
          .select('submission_id, payment_for, paid_at, created_at')
          .in('submission_id', submissionIds)
          .order('paid_at', { ascending: false })
          .order('created_at', { ascending: false });

        if (paymentsError) {
          console.error('Failed to fetch payments summary for submissions:', paymentsError);
        } else if (Array.isArray(payments)) {
          const latestBySubmission = new Map();
          for (const payment of payments) {
            const submissionId = payment?.submission_id;
            if (!submissionId || latestBySubmission.has(submissionId)) {
              continue;
            }
            latestBySubmission.set(submissionId, payment);
          }

          submissions = submissions.map((submission) => {
            const latest = latestBySubmission.get(submission.id);
            return {
              ...submission,
              latestPaymentFor: latest?.payment_for ?? null,
              latestPaymentAt: latest?.paid_at ?? null,
            };
          });
        }
      }
    }

    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
