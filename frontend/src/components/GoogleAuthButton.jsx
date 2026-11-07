import React, { useState } from 'react';
import { isSupabaseConfigured, signInWithGoogle } from '../services/supabase';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function GoogleAuthButton({ role = 'USER', label = 'Continue with Google' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleClick = async () => {
    setError(null);
    setLoading(true);

    try {
      if (!isSupabaseConfigured()) {
        throw new Error(
          'Supabase project credentials not detected. Please add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env.'
        );
      }

      await signInWithGoogle(role);
      // signInWithOAuth initiates a real browser redirection to Google's OAuth consent screen
    } catch (err) {
      console.error('Real Google OAuth initiation error:', err);
      setError(err.message || 'Failed to initiate Google authentication.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full py-3 px-4 bg-white hover:bg-[#F8DDE5]/30 border border-[#EEC5D1] rounded-2xl text-xs sm:text-sm font-bold text-[#494354] shadow-soft hover:shadow-soft-md transition flex items-center justify-center space-x-3 active:scale-99 disabled:opacity-75 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 text-[#494354] animate-spin flex-shrink-0" />
            <span>Redirecting to Google...</span>
          </>
        ) : (
          <>
            {/* Authentic Multi-color Google SVG Logo */}
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.67-5.17 3.67-9.15z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.15C3.26 21.36 7.36 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.27C.46 8.23 0 10.06 0 12s.46 3.77 1.27 5.39l4-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.27 6.61l4 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
              />
            </svg>
            <span>{label}</span>
          </>
        )}
      </button>

      {/* Real Error Feedback Banner */}
      {error && (
        <div className="mt-2.5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-start space-x-2 animate-fade-in text-left">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
          <div className="flex-1">
            <span className="font-bold block text-red-800">Google Authentication Notice:</span>
            <span className="leading-relaxed font-medium">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}
