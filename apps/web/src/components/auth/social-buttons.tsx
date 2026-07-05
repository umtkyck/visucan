'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInAndExchange, type FirebaseSocialProvider } from '@/lib/firebase/auth';
import { isFirebaseConfigured } from '@/lib/firebase/client';

const BUTTON_CLASSES =
  'flex w-full items-center justify-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] py-2.5 text-sm text-white/80 transition-colors hover:border-white/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-50';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.93-2.91l-3.87-3a7.24 7.24 0 0 1-10.8-3.8H1.27v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.26 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.27a12 12 0 0 0 0 10.77l3.99-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43A11.98 11.98 0 0 0 1.27 6.61l3.99 3.11A7.17 7.17 0 0 1 12 4.75Z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.09v-.01ZM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12a12 12 0 1 0-13.88 11.85v-8.38H7.08V12h3.04V9.36c0-3.01 1.79-4.67 4.53-4.67 1.31 0 2.68.23 2.68.23v2.95H15.8c-1.49 0-1.95.93-1.95 1.87V12h3.32l-.53 3.47h-2.79v8.38A12 12 0 0 0 24 12Z"
      />
    </svg>
  );
}

interface SocialButtonsProps {
  /** "Continue" reads naturally on both signin and signup */
  action?: string;
}

const PROVIDERS: Array<{
  id: FirebaseSocialProvider;
  label: string;
  Icon: () => JSX.Element;
}> = [
  { id: 'google', label: 'Google', Icon: GoogleIcon },
  { id: 'apple', label: 'Apple', Icon: AppleIcon },
  { id: 'facebook', label: 'Facebook', Icon: FacebookIcon },
];

export function SocialButtons({ action = 'Continue' }: SocialButtonsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<FirebaseSocialProvider | null>(null);
  const [error, setError] = useState('');
  const firebaseEnabled = isFirebaseConfigured();

  const handleClick = async (provider: FirebaseSocialProvider) => {
    setError('');

    if (!firebaseEnabled) {
      window.location.href = `/api/auth/oauth/${provider}`;
      return;
    }

    setLoading(provider);
    try {
      await signInAndExchange(provider);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Social sign-in failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {PROVIDERS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          disabled={loading !== null}
          onClick={() => void handleClick(id)}
          className={BUTTON_CLASSES}
        >
          <Icon />
          {loading === id ? 'Signing in…' : `${action} with ${label}`}
        </button>
      ))}
    </div>
  );
}

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  provider_not_configured:
    'This sign-in method is not available yet. Please use email and password.',
  unknown_provider: 'Unknown sign-in provider.',
  oauth_state_mismatch: 'Sign-in session expired. Please try again.',
  oauth_failed: 'Social sign-in failed. Please try again or use email and password.',
  firebase_failed: 'Firebase sign-in failed. Please try again.',
};

export function getOAuthErrorMessage(code: string | null): string | null {
  if (!code) return null;
  return OAUTH_ERROR_MESSAGES[code] ?? 'Sign-in failed. Please try again.';
}
