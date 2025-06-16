import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// -----------------------------------------------------------------------------
// Supabase Client
// -----------------------------------------------------------------------------
//  This file exports a single, initialized instance of the Supabase client.
//  Import it anywhere in the app to perform database, storage or auth requests.
//
//  Keys are automatically pulled from Expo config (app.config.* or app.json)
//  but you can override them by editing the fallback values below. Keeping them
//  here allows the project to work out-of-the-box while you set up
//  environment-specific values for production builds.
// -----------------------------------------------------------------------------

const SUPABASE_URL =
  Constants?.expoConfig?.extra?.SUPABASE_URL ??
  'https://eyvnmewbebmqmbgftsag.supabase.co';

const SUPABASE_ANON_KEY =
  Constants?.expoConfig?.extra?.SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5dm5tZXdiZWJtcW1iZ2Z0c2FnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyODc0MzksImV4cCI6MjA2NDg2MzQzOX0.yupMeS3Kxks8OXXU4AwJAkBZdzA7W0zmqQiGRFpBw40';

// Create a singleton Supabase client instance. The AsyncStorage adapter ensures
// that sessions persist between app restarts. `detectSessionInUrl` is disabled
// because React Native apps do not handle traditional browser redirects.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase; 