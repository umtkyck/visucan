'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Check } from 'lucide-react';

const INPUT_CLASSES =
  'w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/25 transition-colors focus:border-sky-400/60 focus:outline-none';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordRequirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!passwordRequirements.every((req) => req.met)) {
      setError('Please meet all password requirements');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Sign up failed');
      }

      router.push('/auth/verify-email?email=' + encodeURIComponent(email));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#05070b] px-4 py-12 text-white">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-12 flex items-center justify-center gap-2.5">
          <span className="block h-2 w-2 rounded-full bg-sky-400" />
          <span className="text-[15px] font-medium tracking-tight">VisuCAN</span>
        </Link>

        <h1 className="text-center text-2xl font-light tracking-tight">
          Create your account
        </h1>
        <p className="mt-2 text-center text-[13px] text-white/40">
          Start designing PCBs with AI assistance
        </p>

        {error && (
          <div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-[13px] text-white/50">
              Full name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={INPUT_CLASSES}
              placeholder="John Doe"
              required
            />
          </div>

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
                placeholder="Create a password"
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

            {password.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {passwordRequirements.map((req) => (
                  <div
                    key={req.label}
                    className={`flex items-center gap-2 text-[12.5px] ${
                      req.met ? 'text-sky-300' : 'text-white/30'
                    }`}
                  >
                    <Check
                      className={`h-3.5 w-3.5 ${req.met ? 'opacity-100' : 'opacity-40'}`}
                    />
                    {req.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-[12.5px] leading-relaxed text-white/35">
            By signing up, you agree to our{' '}
            <Link href="/terms" className="text-white/60 hover:text-white">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-white/60 hover:text-white">
              Privacy Policy
            </Link>
            .
          </p>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-white py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-80 disabled:opacity-40"
          >
            {isLoading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-8 text-center text-[13px] text-white/40">
          Already have an account?{' '}
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
