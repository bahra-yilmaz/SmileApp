import supabase from './supabaseClient';

/**
 * Signs a brand-new user up using email & password.
 *
 * 1. Calls `supabase.auth.signUp`.
 * 2. Inserts an entry into the `users` table (is_guest = false).
 *
 * On success returns the newly created user id.
 *
 * NOTE: Username will be set later via settings; therefore it is omitted here.
 */
export async function signUpWithEmail(rawEmail: string, password: string): Promise<string> {
  if (!rawEmail || !password) {
    throw new Error('Email and password are required.');
  }

  const email = rawEmail.trim().toLowerCase();

  // ---------------------------------------------------------------------------
  // 1) Register the user with Supabase Auth
  // ---------------------------------------------------------------------------
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError || !signUpData?.user) {
    if (signUpError?.code === 'email_address_not_authorized') {
      throw new Error('Email confirmations are restricted for this project. Configure a custom SMTP provider or disable "Confirm email" in Supabase Auth settings.');
    }

    throw signUpError ?? new Error('Unable to sign up user.');
  }

  const userId = signUpData.user.id;

  // ---------------------------------------------------------------------------
  // 2) Create corresponding row inside the public `users` table
  // ---------------------------------------------------------------------------
  const { error: insertError } = await supabase.from('users').insert({
    id: userId,
    is_guest: false,
    created_at: new Date().toISOString(),
  });

  if (insertError) {
    // Optionally, you might want to delete the auth user here to keep auth & db in sync
    throw insertError;
  }

  return userId;
}

/**
 * Signs a user in with email & password.
 *
 * On success returns the user id string.
 */
export async function signInWithEmail(rawEmail: string, password: string): Promise<string> {
  if (!rawEmail || !password) {
    throw new Error('Email and password are required.');
  }

  const email = rawEmail.trim().toLowerCase();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data?.user) {
      if (error?.code === 'invalid_credentials') {
        throw new Error('Incorrect email or password.');
      }
      throw error ?? new Error('Unable to sign in. Please try again later.');
    }

    return data.user.id;
  } catch (err: any) {
    // Network / unexpected errors bubble up here
    if (err?.message === 'Failed to fetch') {
      throw new Error('Network error. Please check your connection and try again.');
    }

    throw err;
  }
} 