'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { completeRedirectSignIn, exchangeFirebaseSession } from '@/lib/firebase/auth';
import { isFirebaseConfigured } from '@/lib/firebase/client';

// Handles Apple (and other) redirect-based Firebase sign-in on page load.
export function FirebaseRedirectHandler() {
  const router = useRouter();

  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    void (async () => {
      try {
        const result = await completeRedirectSignIn();
        if (!result) return;
        const idToken = await result.user.getIdToken();
        await exchangeFirebaseSession(idToken);
        router.replace('/dashboard');
      } catch (error) {
        console.error('Firebase redirect sign-in failed:', error);
      }
    })();
  }, [router]);

  return null;
}
