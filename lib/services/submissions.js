import { supabase, supabaseAdmin } from './supabase-server';
import { resend, getCredentialsEmailTemplate } from './email';
import { generateUsername, generateTemporaryPassword } from './auth';
import {
  handleSubmissionUserIdColumnError,
  isSubmissionUserIdColumnAvailable,
} from './submissionsUserIdColumn';

export async function verifySubmissionById(submissionId) {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .update({ status: 'verified' })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) {
      return {
        status: 500,
        body: { error: 'Failed to verify submission' },
      };
    }

    return {
      status: 200,
      body: {
        success: true,
        message: 'Submission verified',
        data,
      },
    };
  } catch (error) {
    console.error('Submission verify error:', error);
    return {
      status: 500,
      body: { error: 'Internal server error' },
    };
  }
}

export async function generateAccountForSubmission(submissionId) {
  try {
    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      return {
        status: 404,
        body: { error: 'Submission not found' },
      };
    }

    if (submission.status !== 'verified') {
      return {
        status: 400,
        body: { error: 'Submission must be verified first' },
      };
    }

    const username = generateUsername(submission.fullName);
    const password = generateTemporaryPassword();

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: submission.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: submission.fullName,
          username: username,
          phone_number: submission.phoneNumber,
        },
      });

    if (authError) {
      console.error('Auth error:', authError);
      return {
        status: 500,
        body: {
          error: 'Failed to create user account: ' + authError.message,
        },
      };
    }

    const { error: accountMappingError } = await supabaseAdmin
      .from('user_auth_accounts')
      .upsert(
        {
          authUserId: authData.user.id,
          username,
          email: submission.email,
          submissionId,
          updatedAt: new Date().toISOString(),
        },
        { onConflict: 'authUserId' },
      );

    if (accountMappingError) {
      console.error('User auth account upsert error:', accountMappingError);
      return {
        status: 500,
        body: { error: 'Failed to persist user account mapping' },
      };
    }

    const emailFrom = 'info@samuhita.id';
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: emailFrom,
      to: submission.email,
      subject: 'Your Samuhita.id Login Credentials',
      html: getCredentialsEmailTemplate(submission.fullName, username, password),
    });

    if (emailError) {
      console.error('Email error:', emailError);
      console.error('Failed to send credentials email to:', submission.email);
      console.error(
        'Email error details:',
        JSON.stringify(emailError, null, 2),
      );
    } else {
      console.log('Credentials email sent successfully to:', submission.email);
      console.log('Email data:', emailData);
    }

    const { error: credentialsError } = await supabase
      .from('user_credentials')
      .insert([
        {
          submissionId,
          username: username,
          password: password,
        },
      ]);

    if (credentialsError) {
      console.error('Credentials save error:', credentialsError);
      console.error(
        'Failed to save credentials to database:',
        JSON.stringify(credentialsError, null, 2),
      );
    }

    const updatePayload = { status: 'registered' };
    if (isSubmissionUserIdColumnAvailable()) {
      updatePayload.userId = authData.user.id;
    }

    const { error: updateError } = await supabase
      .from('submissions')
      .update(updatePayload)
      .eq('id', submissionId);

    if (updateError) {
      const handled =
        updatePayload.userId &&
        handleSubmissionUserIdColumnError(updateError, 'generateAccountForSubmission');

      if (handled) {
        const { error: statusOnlyError } = await supabase
          .from('submissions')
          .update({ status: 'registered' })
          .eq('id', submissionId);

        if (statusOnlyError) {
          console.error('Status-only update error:', statusOnlyError);
        }
      } else {
        console.error('Update error:', updateError);
      }
    }

    return {
      status: 200,
      body: {
        success: true,
        message: 'Account created and credentials sent via email',
        username: username,
        email: submission.email,
        emailSent: !emailError,
        emailError: emailError?.message || null,
        emailFrom: emailFrom,
        userId: authData.user.id,
        credentialsSaved: !credentialsError,
      },
    };
  } catch (error) {
    console.error('Generate account error:', error);
    return {
      status: 500,
      body: { error: 'Internal server error: ' + error.message },
    };
  }
}

export async function deleteSubmissionById(submissionId) {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .delete()
      .eq('id', submissionId)
      .select();

    if (error) {
      console.error('Delete submission error:', error);
      return {
        status: 500,
        body: { error: 'Failed to delete submission' },
      };
    }

    if (!data || data.length === 0) {
      return {
        status: 404,
        body: { error: 'Submission not found' },
      };
    }

    return {
      status: 200,
      body: {
        success: true,
        message: 'Submission deleted successfully',
        deleted: data[0],
      },
    };
  } catch (error) {
    console.error('Delete submission exception:', error);
    return {
      status: 500,
      body: { error: 'Internal server error' },
    };
  }
}

export async function purgeSubmissions({ emailPattern } = {}) {
  try {
    if (emailPattern) {
      const { data, error } = await supabase
        .from('submissions')
        .delete()
        .ilike('email', `%${emailPattern}%`)
        .select();

      if (error) {
        console.error('Delete submissions by pattern error:', error);
        return {
          status: 500,
          body: { error: 'Failed to delete submissions' },
        };
      }

      return {
        status: 200,
        body: {
          success: true,
          message: `Deleted ${data?.length || 0} submissions matching pattern: ${emailPattern}`,
          deleted: data || [],
        },
      };
    }

    const testPatterns = ['test', 'example.com', 'demo', 'fixed@test.com'];
    let totalDeleted = [];

    for (const pattern of testPatterns) {
      const { data, error } = await supabase
        .from('submissions')
        .delete()
        .ilike('email', `%${pattern}%`)
        .select();

      if (!error && data) {
        totalDeleted = totalDeleted.concat(data);
      }
    }

    return {
      status: 200,
      body: {
        success: true,
        message: `Deleted ${totalDeleted.length} test submissions`,
        deleted: totalDeleted,
      },
    };
  } catch (error) {
    console.error('Purge submissions exception:', error);
    return {
      status: 500,
      body: { error: 'Internal server error' },
    };
  }
}

export async function checkExistingSubmission({ email, phoneNumber }) {
  try {
    let query = supabase.from('submissions').select('email, phoneNumber, status');

    if (email && phoneNumber) {
      query = query.or(`email.eq.${email},phoneNumber.eq.${phoneNumber}`);
    } else if (email) {
      query = query.eq('email', email);
    } else if (phoneNumber) {
      query = query.eq('phoneNumber', phoneNumber);
    } else {
      return {
        status: 400,
        body: { error: 'Email or phone number parameter is required' },
      };
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error checking existing submissions:', error);
      return {
        status: 500,
        body: { error: 'Failed to check existing submissions' },
      };
    }

    const response = {
      exists: false,
      emailExists: false,
      phoneExists: false,
      submissions: [],
    };

    if (data && data.length > 0) {
      response.exists = true;
      response.submissions = data;
      if (email) {
        response.emailExists = data.some(sub => sub.email === email);
      }
      if (phoneNumber) {
        response.phoneExists = data.some(sub => sub.phoneNumber === phoneNumber);
      }
    }

    return {
      status: 200,
      body: response,
    };
  } catch (error) {
    console.error('Check existing error:', error);
    return {
      status: 500,
      body: { error: 'Internal server error: ' + error.message },
    };
  }
}
