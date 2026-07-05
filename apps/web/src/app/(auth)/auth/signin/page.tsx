'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { SocialButtons, getOAuthErrorMessage } from '@/components/auth/social-buttons';

const INPUT_CLASSES =
  'w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/25 transition-colors focus:border-sky-400/60 focus:outline-none';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Surface OAuth redirect errors (?error=...) without requiring Suspense
    const params = new URLSearchParams(window.location.search);
    const message = getOAuthErrorMessage(params.get('error'));
    if (message) setError(message);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Sign in failed');
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#05070b] px-4 text-white">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-12 flex items-center justify-center">
          <Logo
            markClassName="h-6 w-6"
            textClassName="font-display text-lg font-medium tracking-tight"
          />
        </Link>

        <h1 className="text-center font-display text-2xl font-light tracking-tight">
          Welcome back
        </h1>
        <p className="mt-2 text-center text-[13px] text-white/40">
          Sign in to continue designing
        </p>

        {error && (
          <div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-[13px] text-white/50">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={INPUT_CLASSES}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-[13px] text-white/50"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${INPUT_CLASSES} pr-11`}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/70"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link
              href="/auth/forgot-password"
              className="text-[13px] text-white/40 transition-colors hover:text-white"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-white py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-80 disabled:opacity-40"
          >
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-[11px] uppercase tracking-widest text-white/30">or</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <SocialButtons />

        <p className="mt-8 text-center text-[13px] text-white/40">
          Don&apos;t have an account?{' '}
          <Link
            href="/auth/signup"
            className="text-sky-300 transition-colors hover:text-sky-200"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
