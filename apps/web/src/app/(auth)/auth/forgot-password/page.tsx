'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/brand/logo';

const INPUT_CLASSES =
  'w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/25 transition-colors focus:border-sky-400/60 focus:outline-none';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Request failed');
      }

      setMessage(
        data.data?.message ??
          'If an account exists with this email, you will receive a password reset link.'
      );
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
          Reset your password
        </h1>
        <p className="mt-2 text-center text-[13px] text-white/40">
          Enter your email and we&apos;ll send you a reset link
        </p>

        {error && (
          <div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
        {message && (
          <div className="mt-6 rounded-lg border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm text-sky-200">
            {message}
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-white py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-80 disabled:opacity-40"
          >
            {isLoading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>

        <p className="mt-8 text-center text-[13px] text-white/40">
          Remembered it?{' '}
          <Link
            href="/auth/signin"
            className="text-sky-300 transition-colors hover:text-sky-200"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
