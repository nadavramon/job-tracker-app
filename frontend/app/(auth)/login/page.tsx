'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Briefcase, CircleAlert } from 'lucide-react';
import { login } from '@/lib/authService';
import { setUsername } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errorMessages';
import SegmentedThemeToggle from '@/components/ui/SegmentedThemeToggle';
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
      setUsername(response.username);
      router.push('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--auth-bg)]">
      {/* Mesh gradient — top-left */}
      <div
        className="pointer-events-none absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, var(--auth-mesh-1) 0%, transparent 70%)' }}
        aria-hidden="true"
      />
      {/* Mesh gradient — bottom-right */}
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, var(--auth-mesh-2) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

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
      <div className="relative mx-4 w-full max-w-md rounded-2xl border border-[var(--auth-glass-border)] bg-[var(--auth-glass-bg)] p-8 shadow-xl shadow-black/5 dark:shadow-black/30 backdrop-blur-xl animate-[fade-in_0.4s_ease-out]">

        {/* Brand mark */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm">
            <Briefcase className="h-6 w-6" aria-hidden="true" />
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
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            variant="glass"
            label="Email or Username"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
            required
          />
          <Input
            variant="glass"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <Button variant="glass" type="submit" loading={loading} size="lg" className="mt-1 w-full">
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3" aria-hidden="true">
          <div className="h-px flex-1 bg-[var(--auth-glass-border)]" />
          <span className="text-xs text-[var(--muted-foreground)]">or</span>
          <div className="h-px flex-1 bg-[var(--auth-glass-border)]" />
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

        {/* Theme toggle */}
        <div className="mt-6 flex justify-center">
          <SegmentedThemeToggle />
        </div>
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
