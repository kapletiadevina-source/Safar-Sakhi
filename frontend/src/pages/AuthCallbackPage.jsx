import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithGoogleCallback } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const handleAuthCallback = async () => {
      try {
        const role = searchParams.get('role') || 'USER';
        const code = searchParams.get('code');

        if (!supabase) {
          throw new Error('Supabase client is not configured. Please verify your environment keys.');
        }

        let activeSession = null;

        // If authorization code is present (PKCE flow), exchange code for session immediately
        if (code) {
          try {
            const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (!exchangeError && exchangeData?.session) {
              activeSession = exchangeData.session;
            }
          } catch (exchangeErr) {
            console.warn('PKCE exchange error, trying getSession:', exchangeErr);
          }
        }

        if (!activeSession) {
          const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();

          if (sessionError) throw sessionError;

          if (initialSession && initialSession.user) {
            activeSession = initialSession;
          } else {
            // If session is still in flight (e.g. hash parsing or background exchange), listen for auth change
            activeSession = await new Promise((resolve) => {
              let done = false;
              const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
                if (newSession && newSession.user && !done) {
                  done = true;
                  subscription.unsubscribe();
                  resolve(newSession);
                }
              });

              // 4-second fallback timeout
              setTimeout(() => {
                if (!done) {
                  done = true;
                  subscription.unsubscribe();
                  resolve(null);
                }
              }, 4000);
            });
          }
        }

        if (!activeSession || !activeSession.user) {
          throw new Error('No active Google session detected. Please sign in again.');
        }

        const suUser = activeSession.user;
        const email = suUser.email;
        const fullName =
          suUser.user_metadata?.full_name ||
          suUser.user_metadata?.name ||
          suUser.user_metadata?.user_name ||
          suUser.identities?.[0]?.identity_data?.full_name ||
          suUser.identities?.[0]?.identity_data?.name ||
          email.split('@')[0];
        const avatar =
          suUser.user_metadata?.avatar_url ||
          suUser.user_metadata?.picture ||
          suUser.identities?.[0]?.identity_data?.avatar_url ||
          suUser.identities?.[0]?.identity_data?.picture ||
          null;

        // Register or login through backend to ensure safe DB role persistence
        const authUser = await loginWithGoogleCallback({
          email,
          fullName,
          avatar,
          role,
          supabaseId: suUser.id
        });

        // Determine destination based on database record role
        const actualRole = authUser?.user?.role || role;

        if (!isMounted) return;

        if (actualRole === 'FAMILY') {
          navigate('/family', { replace: true });
        } else if (actualRole === 'ADMIN') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } catch (err) {
        console.error('Google Auth callback error:', err);
        if (isMounted) {
          setError(err.message || 'Failed to complete Google authentication.');
        }
      }
    };

    handleAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [navigate, searchParams, loginWithGoogleCallback]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#FFFCF8] rounded-3xl p-8 border border-[#EEC5D1] shadow-soft-lg text-center space-y-4">
        {error ? (
          <>
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 border border-red-200 mx-auto flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-[#494354]">Authentication Notice</h3>
            <p className="text-xs text-red-600 font-medium leading-relaxed">{error}</p>
            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <Link
                to="/login"
                className="px-4 py-2 bg-[#494354] hover:bg-[#383340] text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-soft"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Login</span>
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-[#F8DDE5] text-[#494354] border border-[#EEC5D1] mx-auto flex items-center justify-center animate-pulse">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-[#494354]">Verifying Google Identity...</h3>
            <p className="text-xs text-[#6B6477]">
              Securing session and redirecting you to your Safar Sakhi dashboard.
            </p>
            <div className="w-8 h-8 border-3 border-[#EEC5D1] border-t-[#494354] rounded-full animate-spin mx-auto"></div>
          </>
        )}
      </div>
    </div>
  );
}
