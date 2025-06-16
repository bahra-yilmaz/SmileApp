import supabase from './supabaseClient';

/**
 * Signs a user in as a guest.
 *
 * Step-by-step:
 * 1. Generates a pseudo-random guest ID (UUID when supported).
 * 2. Constructs a fake email using that ID (guest_<id>@smileapp.com).
 * 3. Signs the user up via Supabase with the email + ID as password.
 * 4. Inserts a matching record into the `users` table flagged as guest.
 *
 * On success returns the auth session and the new user ID.
 */
export async function signInAsGuest(): Promise<{ session: any; userId: string }> {
  // ---------------------------------------------------------------------------
  // Generate a unique ID – use crypto.randomUUID when available, otherwise
  // fall back to a timestamp-based string.
  // ---------------------------------------------------------------------------
  const generateGuestId = (): string => {
    // @ts-ignore - React Native / Hermes now polyfills WebCrypto in most cases
    if (typeof global?.crypto?.randomUUID === 'function') {
      // @ts-ignore
      return global.crypto.randomUUID();
    }

    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  };

  const guestId = generateGuestId();
  const email = `guest_${guestId}@smileapp.com`;
  const password = guestId; // Not secure but fine for ephemeral guest accounts

  // ---------------------------------------------------------------------------
  // 1) Sign the user up with Supabase auth
  // ---------------------------------------------------------------------------
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError || !signUpData?.user) {
    throw signUpError ?? new Error('Unable to sign up guest user.');
  }

  const userId = signUpData.user.id;

  // ---------------------------------------------------------------------------
  // 2) Insert a corresponding row into the `users` table (is_guest = true)
  // ---------------------------------------------------------------------------
  const { error: insertError } = await supabase.from('users').insert({
    id: userId,
    is_guest: true,
    created_at: new Date().toISOString(),
  });

  if (insertError) {
    // Rollback auth user if desired – for now, just surface the error
    throw insertError;
  }

  return {
    session: signUpData.session,
    userId,
  };
} 