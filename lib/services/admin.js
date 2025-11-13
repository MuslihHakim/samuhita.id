import { supabase, supabaseAdmin } from './supabase-server';
import { listCvAssets, removeCvAssets } from './storage';
import {
  handleSubmissionUserIdColumnError,
  isSubmissionUserIdColumnAvailable,
} from './submissionsUserIdColumn';

const AUTH_USERS_PAGE_SIZE = 100;
const AUTH_USERS_MAX_PAGES = 20;

const normalizeEmail = email =>
  typeof email === 'string' ? email.trim().toLowerCase() : null;

export async function lookupAuthUsersByEmails(emails = []) {
  const normalizedEmails = new Set(
    emails.map(normalizeEmail).filter(Boolean),
  );

  if (!normalizedEmails.size) {
    return {
      status: 200,
      body: new Map(),
    };
  }

  try {
    const foundUsers = new Map();

    for (let page = 1; page <= AUTH_USERS_MAX_PAGES; page += 1) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: AUTH_USERS_PAGE_SIZE,
      });

      if (error) {
        console.error('Supabase listUsers error:', error);
        return {
          status: 500,
          body: { error: 'Failed to fetch users' },
        };
      }

      const users = data?.users ?? [];
      for (const user of users) {
        const normalized = normalizeEmail(user.email);
        if (normalized && normalizedEmails.has(normalized) && !foundUsers.has(normalized)) {
          foundUsers.set(normalized, {
            id: user.id,
            email: user.email,
            user_metadata: user.user_metadata,
          });
        }
      }

      const foundAll = foundUsers.size === normalizedEmails.size;
      const hasMore = Array.isArray(users) && users.length === AUTH_USERS_PAGE_SIZE;
      if (foundAll || !hasMore) {
        break;
      }
    }

    return {
      status: 200,
      body: foundUsers,
    };
  } catch (error) {
    console.error('lookupAuthUsersByEmails error:', error);
    return {
      status: 500,
      body: { error: 'Internal server error: ' + error.message },
    };
  }
}

export async function fetchAdminUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return {
      status: 400,
      body: { error: 'Email required' },
    };
  }

  const result = await lookupAuthUsersByEmails([normalizedEmail]);
  if (result.status !== 200) {
    return result;
  }

  const user = result.body.get(normalizedEmail);

  if (!user) {
    return {
      status: 404,
      body: { error: 'User not found' },
    };
  }

  return {
    status: 200,
    body: user,
  };
}

export async function fetchAdminUserById(adminUserId) {
  if (!adminUserId) {
    return {
      status: 400,
      body: { error: 'Admin user id required' },
    };
  }

  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, email, username, "createdAt"')
      .eq('id', adminUserId)
      .single();

    if (error) {
      console.error('fetchAdminUserById error:', error);
      return {
        status: 500,
        body: { error: 'Failed to load admin user' },
      };
    }

    if (!data) {
      return {
        status: 404,
        body: { error: 'Admin user not found' },
      };
    }

    return {
      status: 200,
      body: data,
    };
  } catch (error) {
    console.error('fetchAdminUserById exception:', error);
    return {
      status: 500,
      body: { error: 'Failed to load admin user' },
    };
  }
}

export async function fetchSubmissionByUserId(userId) {
  if (!userId) {
    return {
      status: 400,
      body: { error: 'User ID required' },
    };
  }

  try {
    const { data: submissionByUserId } = await supabase
      .from('submissions')
      .select('*')
      .eq('userId', userId)
      .single();

    if (submissionByUserId) {
      return {
        status: 200,
        body: submissionByUserId,
      };
    }

    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (authError || !authUser?.user) {
      return {
        status: 404,
        body: { error: 'User not found' },
      };
    }

    const userEmail = authUser.user.email;

    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (submissionError || !submission) {
      return {
        status: 404,
        body: { error: 'Submission not found for this user' },
      };
    }

    if (!submission.userId && isSubmissionUserIdColumnAvailable()) {
      const { error: updateError } = await supabase
        .from('submissions')
        .update({ userId })
        .eq('id', submission.id);

      if (updateError) {
        if (!handleSubmissionUserIdColumnError(updateError, 'fetchSubmissionByUserId')) {
          console.error('Failed to persist userId for submission:', updateError);
        }
      } else {
        submission.userId = userId;
      }
    }

    submission.userId = submission.userId ?? userId;

    return {
      status: 200,
      body: submission,
    };
  } catch (error) {
    console.error('Get submission by user ID error:', error);
    return {
      status: 500,
      body: { error: 'Internal server error: ' + error.message },
    };
  }
}

export async function fetchCredentialsForSubmission(submissionId) {
  if (!submissionId) {
    return {
      status: 400,
      body: { error: 'Submission ID required' },
    };
  }

  try {
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      return {
        status: 404,
        body: { error: 'Submission not found' },
      };
    }

    if (submission.status !== 'registered') {
      return {
        status: 400,
        body: {
          error: 'Credentials only available for registered submissions',
        },
      };
    }

    const { data: credentials, error: credentialsError } = await supabase
      .from('user_credentials')
      .select('*')
      .eq('submissionId', submissionId)
      .single();

    if (credentialsError || !credentials) {
      return {
        status: 404,
        body: { error: 'Credentials not found' },
      };
    }

    await supabase
      .from('user_credentials')
      .update({
        viewedByAdmin: true,
        viewedAt: new Date().toISOString(),
      })
      .eq('id', credentials.id);

    return {
      status: 200,
      body: {
        username: credentials.username,
        password: credentials.password,
        createdAt: credentials.createdAt,
        viewedAt: credentials.viewedAt,
        submission: {
          fullName: submission.fullName,
          email: submission.email,
          phoneNumber: submission.phoneNumber,
        },
      },
    };
  } catch (error) {
    console.error('Get credentials error:', error);
    return {
      status: 500,
      body: { error: 'Internal server error: ' + error.message },
    };
  }
}

export async function deleteUserAndData(submissionId) {
  if (!submissionId) {
    return {
      status: 400,
      body: { error: 'Submission ID required' },
    };
  }

  try {
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      return {
        status: 404,
        body: { error: 'User submission not found' },
      };
    }

    let authLookupResult = null;
    let authUser = null;

    if (submission.status === 'registered') {
      authLookupResult = await lookupAuthUsersByEmails([submission.email]);
      if (authLookupResult.status === 200) {
        authUser = authLookupResult.body.get(normalizeEmail(submission.email)) ?? null;
      } else {
        console.error(
          'Failed to lookup Supabase auth user for deletion:',
          authLookupResult.body?.error,
        );
      }
    }

    const submissionUserId = submission.userId ?? authUser?.id ?? null;
    const userIdsForCleanup = [...new Set([submissionUserId, submission.id].filter(Boolean))];

    const deletionLog = {
      submission: {
        id: submission.id,
        email: submission.email,
        fullName: submission.fullName,
        phoneNumber: submission.phoneNumber,
        status: submission.status,
        userId: submissionUserId ?? null,
      },
      deletedAt: new Date().toISOString(),
      steps: [],
    };

    // Step 1: Delete CV data
    try {
      const { error: cvError } = await supabase
        .from('cv_data')
        .delete()
        .in('userId', userIdsForCleanup);

      if (cvError) {
        console.error('Error deleting CV data:', cvError);
        deletionLog.steps.push({
          step: 'CV data deletion',
          status: 'error',
          error: cvError.message,
        });
      } else {
        deletionLog.steps.push({
          step: 'CV data deletion',
          status: 'success',
        });
      }
    } catch (error) {
      console.error('Exception deleting CV data:', error);
      deletionLog.steps.push({
        step: 'CV data deletion',
        status: 'error',
        error: error.message,
      });
    }

    // Step 2: Delete user credentials
    try {
      const { error: credentialsError } = await supabase
        .from('user_credentials')
        .delete()
        .eq('submissionId', submissionId);

      if (credentialsError) {
        console.error('Error deleting user credentials:', credentialsError);
        deletionLog.steps.push({
          step: 'User credentials deletion',
          status: 'error',
          error: credentialsError.message,
        });
      } else {
        deletionLog.steps.push({
          step: 'User credentials deletion',
          status: 'success',
        });
      }
    } catch (error) {
      console.error('Exception deleting user credentials:', error);
      deletionLog.steps.push({
        step: 'User credentials deletion',
        status: 'error',
        error: error.message,
      });
    }

    // Step 3: Delete uploaded files
    try {
      const filesToDelete = [];
      const listErrors = [];

      for (const folder of userIdsForCleanup) {
        const { data: files, error: listError } = await listCvAssets(folder);

        if (listError) {
          console.error(`Error listing storage files for folder ${folder}:`, listError);
          listErrors.push({ folder, error: listError });
          continue;
        }

        if (files && files.length > 0) {
          filesToDelete.push(
            ...files.map(file => ({
              folder,
              name: file.name,
            })),
          );
        }
      }

      if (filesToDelete.length > 0) {
        const paths = filesToDelete.map(file => `${file.folder}/${file.name}`);
        const { error: deleteFilesError } = await removeCvAssets(paths);

        if (deleteFilesError) {
          console.error('Error deleting storage files:', deleteFilesError);
          deletionLog.steps.push({
            step: 'Storage files deletion',
            status: 'error',
            error: deleteFilesError.message,
          });
        } else {
          deletionLog.steps.push({
            step: 'Storage files deletion',
            status: 'success',
            filesDeleted: paths.length,
          });
        }
      } else if (listErrors.length > 0) {
        deletionLog.steps.push({
          step: 'Storage files deletion',
          status: 'error',
          error: listErrors.map(err => `${err.folder}: ${err.error.message}`).join('; '),
        });
      } else {
        deletionLog.steps.push({
          step: 'Storage files deletion',
          status: 'no_files_found',
        });
      }
    } catch (error) {
      console.error('Exception deleting storage files:', error);
      deletionLog.steps.push({
        step: 'Storage files deletion',
        status: 'error',
        error: error.message,
      });
    }

    // Step 4: Delete submission record
    try {
      const { error: submissionDeleteError } = await supabase
        .from('submissions')
        .delete()
        .eq('id', submissionId);

      if (submissionDeleteError) {
        console.error('Error deleting submission:', submissionDeleteError);
        deletionLog.steps.push({
          step: 'Submission deletion',
          status: 'error',
          error: submissionDeleteError.message,
        });
        return {
          status: 500,
          body: {
            error: 'Failed to delete submission: ' + submissionDeleteError.message,
            deletionLog,
          },
        };
      }

      deletionLog.steps.push({
        step: 'Submission deletion',
        status: 'success',
      });
    } catch (error) {
      console.error('Exception deleting submission:', error);
      deletionLog.steps.push({
        step: 'Submission deletion',
        status: 'error',
        error: error.message,
      });
      return {
        status: 500,
        body: { error: 'Failed to delete submission: ' + error.message, deletionLog },
      };
    }

    // Step 5: Delete Supabase Auth user if registered
    if (submission.status === 'registered') {
      try {
        if (authLookupResult && authLookupResult.status !== 200) {
          deletionLog.steps.push({
            step: 'Supabase Auth user deletion',
            status: 'error',
            error: authLookupResult.body?.error || 'Failed to fetch Supabase users',
          });
        } else if (authUser) {
          const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(
            authUser.id,
            true,
          );

          if (deleteUserError) {
            console.error('Error deleting Supabase Auth user:', deleteUserError);
            deletionLog.steps.push({
              step: 'Supabase Auth user deletion',
              status: 'error',
              error: deleteUserError.message,
            });
          } else {
            deletionLog.steps.push({
              step: 'Supabase Auth user deletion',
              status: 'success',
              userId: authUser.id,
            });
          }
        } else {
          deletionLog.steps.push({
            step: 'Supabase Auth user deletion',
            status: 'user_not_found',
          });
        }
      } catch (error) {
        console.error('Exception deleting Supabase Auth user:', error);
        deletionLog.steps.push({
          step: 'Supabase Auth user deletion',
          status: 'error',
          error: error.message,
        });
      }
    } else {
      deletionLog.steps.push({
        step: 'Supabase Auth user deletion',
        status: 'skipped',
        reason: 'User not registered',
      });
    }

    console.log('User deletion completed:', JSON.stringify(deletionLog, null, 2));

    return {
      status: 200,
      body: {
        success: true,
        message: `User ${submission.fullName} (${submission.email}) has been completely deleted. Email and phone number are now available for reuse.`,
        deletedUser: {
          fullName: submission.fullName,
          email: submission.email,
          phoneNumber: submission.phoneNumber,
          originalStatus: submission.status,
        },
        deletionLog,
      },
    };
  } catch (error) {
    console.error('Delete user error:', error);
    return {
      status: 500,
      body: { error: 'Internal server error: ' + error.message },
    };
  }
}
