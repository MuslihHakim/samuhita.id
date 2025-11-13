import {
  generateUsername,
  generateTemporaryPassword,
  hashPassword,
  comparePassword,
} from '../auth-utils';
import { supabase, supabaseAdmin } from './supabase-server';

export {
  generateUsername,
  generateTemporaryPassword,
  hashPassword,
  comparePassword,
};

export async function login({ username, password, isAdmin }) {
  if (!username || !password) {
    return {
      status: 400,
      body: { error: 'Username and password required' },
    };
  }

  if (isAdmin) {
    return loginAdmin({ username, password });
  }

  return loginUser({ username, password });
}

async function loginAdmin({ username, password }) {
  try {
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .single();

    if (adminError || !adminData) {
      return {
        status: 401,
        body: { error: 'Invalid credentials' },
      };
    }

    const isValid = await comparePassword(password, adminData.passwordHash);
    if (!isValid) {
      return {
        status: 401,
        body: { error: 'Invalid credentials' },
      };
    }

    return {
      status: 200,
      body: {
        success: true,
        user: {
          id: adminData.id,
          email: adminData.email,
          username: adminData.username,
          isAdmin: true,
        },
      },
    };
  } catch (error) {
    console.error('Admin login error:', error);
    return {
      status: 500,
      body: { error: 'Internal server error' },
    };
  }
}

export async function createAdminUser({ email, username, password }) {
  if (!email || !username || !password) {
    return {
      status: 400,
      body: { error: 'Email, username, and password required' },
    };
  }

  try {
    const passwordHash = await hashPassword(password);

    const { data, error } = await supabase
      .from('admin_users')
      .insert([{ email, username, passwordHash }])
      .select()
      .single();

    if (error) {
      console.error('Admin creation error:', error);
      return {
        status: 500,
        body: { error: 'Failed to create admin user: ' + error.message },
      };
    }

    return {
      status: 200,
      body: {
        success: true,
        message: 'Admin user created successfully',
        admin: { id: data.id, email: data.email, username: data.username },
      },
    };
  } catch (error) {
    console.error('Admin creation exception:', error);
    return {
      status: 500,
      body: { error: 'Internal server error' },
    };
  }
}

async function loginUser({ username, password }) {
  try {
    const normalizedUsername =
      typeof username === 'string' ? username.trim().toLowerCase() : '';

    if (!normalizedUsername) {
      return {
        status: 401,
        body: { error: 'Invalid credentials' },
      };
    }

    const { data: account, error: accountError } = await supabaseAdmin
      .from('user_auth_accounts')
      .select('authUserId, username, email')
      .eq('usernameLower', normalizedUsername)
      .maybeSingle();

    if (accountError) {
      console.error('Error fetching user account:', accountError);
      return {
        status: 500,
        body: { error: 'Authentication failed' },
      };
    }

    if (!account || !account.email) {
      return {
        status: 401,
        body: { error: 'Invalid credentials' },
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: account.email,
      password,
    });

    if (error) {
      return {
        status: 401,
        body: { error: 'Invalid credentials' },
      };
    }

    return {
      status: 200,
      body: {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          username: account.username || data.user.user_metadata?.username || data.user.email,
          isAdmin: false,
        },
        session: data.session,
      },
    };
  } catch (error) {
    console.error('User login error:', error);
    return {
      status: 500,
      body: { error: 'Internal server error' },
    };
  }
}
