import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Clean and sanitize URL: remove trailing slashes and any accidentally appended paths
const cleanUrl = rawUrl
  .trim()
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/auth\/v1\/?$/, '')
  .replace(/\/+$/, '');

const cleanKey = rawKey.trim();

export const isSupabaseConfigured = () => {
  return Boolean(
    cleanUrl &&
    cleanUrl !== '' &&
    !cleanUrl.includes('placeholder') &&
    cleanKey &&
    cleanKey !== '' &&
    !cleanKey.includes('placeholder')
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(cleanUrl, cleanKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      global: {
        headers: {
          apikey: cleanKey
        }
      }
    })
  : null;

export const signInWithGoogle = async (role = 'USER') => {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error(
      'Supabase credentials are not configured. Please add your actual VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env.'
    );
  }

  // Real Google OAuth initiation with role context in redirect
  const redirectTo = `${window.location.origin}/auth/callback?role=${encodeURIComponent(role)}`;

  // Use skipBrowserRedirect: true so we can inspect and guarantee apikey is in the URL before redirecting
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account consent',
        apikey: cleanKey
      }
    }
  });

  if (error) {
    throw error;
  }

  if (data?.url) {
    const authUrl = new URL(data.url);
    // Explicitly guarantee apikey is present in the query parameters for Kong API Gateway
    if (!authUrl.searchParams.has('apikey')) {
      authUrl.searchParams.set('apikey', cleanKey);
    }
    window.location.assign(authUrl.toString());
    return data;
  }

  return data;
};
