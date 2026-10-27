import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const [error, setError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const getFirebaseErrorMessage = (err: any): string => {
    const code = err.code || '';
    switch (code) {
      case 'auth/popup-closed-by-user':
        return 'Google sign-in popup was closed before completing.';
      case 'auth/cancelled-popup-request':
        return 'Sign-in was cancelled.';
      case 'auth/too-many-requests':
        return 'Access temporarily restricted due to repeated attempts. Please try again later.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      default:
        return err.message || 'Authentication failed. Please verify credentials.';
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);

    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden selection:bg-white selection:text-black">
      {/* Background Subtle Monochrome Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/[0.03] blur-[120px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white text-black shadow-2xl ring-1 ring-white/20 mb-4">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">ServFex Super Admin</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Platform Master Control & Operational Console
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-zinc-950/90 border border-zinc-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl ring-1 ring-white/5">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-zinc-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick One-Click Google Sign-In Only */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-zinc-200 active:bg-zinc-300 text-black font-bold text-sm shadow-lg flex items-center justify-center gap-3 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-black" />
                <span>Authorizing with Google...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.9c2.28-2.1 3.645-5.2 3.645-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.9-3.05c-1.08.72-2.45 1.16-4.03 1.16-3.1 0-5.74-2.1-6.68-4.93H1.21v3.13C3.25 21.43 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.32 14.27c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.6H1.21C.44 8.13 0 9.85 0 12s.44 3.87 1.21 5.4l4.11-3.13z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.77c1.76 0 3.34.61 4.58 1.8l3.43-3.43C17.94 1.18 15.23 0 12 0 7.33 0 3.25 2.57 1.21 6.6l4.11 3.13c.94-2.83 3.58-4.96 6.68-4.96z"
                  />
                </svg>
                <span>Continue with Authorized Google Account</span>
              </>
            )}
          </button>

          <div className="mt-8 pt-6 border-t border-zinc-800/80 text-center">
            <p className="text-xs text-zinc-500 font-medium leading-relaxed">
              Only authorized Super Admin emails can gain access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
