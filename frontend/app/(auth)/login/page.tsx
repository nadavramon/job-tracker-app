'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/lib/authService';
import { setToken, setUsername } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errorMessages';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [expiredOpen, setExpiredOpen] = useState(searchParams.get('expired') === 'true');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login({ identifier, password });
      setToken(response.token);
      setUsername(response.username);
      router.push('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--background)]">
      {/* Decorative background gradient for depth */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-transparent"
        aria-hidden="true"
      />

      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <Modal
        open={expiredOpen}
        onClose={() => setExpiredOpen(false)}
        title="Session Expired"
      >
        <p className="text-sm text-[var(--muted-foreground)]">
          Your session has expired. Please log in again to continue.
        </p>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => setExpiredOpen(false)}>OK</Button>
        </div>
      </Modal>

      {/* Auth card */}
      <div className="relative mx-4 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-xl shadow-black/5 dark:shadow-black/30">

        {/* Brand mark */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--card-foreground)]">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Sign in to your JobTracker account
            </p>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-lg border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 px-4 py-3 text-sm text-[var(--destructive)]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            label="Email or Username"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <Button type="submit" loading={loading} size="lg" className="mt-1 w-full">
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3" aria-hidden="true">
          <div className="h-px flex-1 bg-[var(--border)]" />
          <span className="text-xs text-[var(--muted-foreground)]">or</span>
          <div className="h-px flex-1 bg-[var(--border)]" />
        </div>

        <p className="text-center text-sm text-[var(--muted-foreground)]">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-semibold text-[var(--primary)] transition-opacity duration-150 hover:opacity-75 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
