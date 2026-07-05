import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  type UserCredential,
} from 'firebase/auth';
import {
  getFirebaseAuth,
  getGoogleProvider,
  getAppleProvider,
  getFacebookProvider,
  isFirebaseConfigured,
} from './client';

export type FirebaseSocialProvider = 'google' | 'apple' | 'facebook';

function getProvider(provider: FirebaseSocialProvider) {
  switch (provider) {
    case 'google':
      return getGoogleProvider();
    case 'apple':
      return getAppleProvider();
    case 'facebook':
      return getFacebookProvider();
    default: {
      const exhaustive: never = provider;
      return exhaustive;
    }
  }
}

// Apple Sign In on Safari often blocks popups; redirect is more reliable there.
function shouldUseRedirect(provider: FirebaseSocialProvider): boolean {
  if (provider !== 'apple') return false;
  if (typeof navigator === 'undefined') return false;
  return /Safari/.test(navigator.userAgent) && !/Chrome|Chromium|Edg/.test(navigator.userAgent);
}

export async function signInWithSocialProvider(
  provider: FirebaseSocialProvider
): Promise<UserCredential | null> {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured');
  }

  const auth = getFirebaseAuth();
  const authProvider = getProvider(provider);

  if (shouldUseRedirect(provider)) {
    await signInWithRedirect(auth, authProvider);
    return null;
  }

  return signInWithPopup(auth, authProvider);
}

export async function completeRedirectSignIn(): Promise<UserCredential | null> {
  if (!isFirebaseConfigured()) return null;
  return getRedirectResult(getFirebaseAuth());
}

export async function exchangeFirebaseSession(idToken: string): Promise<void> {
  const response = await fetch('/api/auth/firebase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Firebase sign-in failed');
  }
}

export async function signInAndExchange(provider: FirebaseSocialProvider): Promise<void> {
  const result = await signInWithSocialProvider(provider);
  if (!result) return; // redirect flow — page will reload with result
  const idToken = await result.user.getIdToken();
  await exchangeFirebaseSession(idToken);
}
