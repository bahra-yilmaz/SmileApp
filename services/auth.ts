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

  console.log('✅ Auth user created successfully. User ID:', userId);

  // ---------------------------------------------------------------------------
  // 2) Create corresponding row inside the public `users` table
  // ---------------------------------------------------------------------------
  console.log('🔄 Creating user record in users table via RPC...');
  
  const { data: rpcResult, error: rpcError } = await supabase
    .rpc('create_user_record', {
      user_id: userId,
      is_guest_user: false
    });

  console.log('🔄 User record RPC result:', { rpcResult, rpcError });

  if (rpcError) {
    console.error('❌ Failed to create user record via RPC:', rpcError);
    throw rpcError;
  }

  if (!rpcResult?.success) {
    console.error('❌ RPC returned failure:', rpcResult);
    throw new Error(rpcResult?.error || 'Failed to create user record');
  }

  console.log('✅ User record created successfully via RPC');
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