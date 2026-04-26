'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Briefcase, CircleAlert } from 'lucide-react';
import { login } from '@/lib/authService';
import { setUsername } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errorMessages';
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
    <>
      <Modal
        open={expiredOpen}
        onClose={() => setExpiredOpen(false)}
        title="Session Expired"
      >
        <p className="text-sm text-(--muted-foreground)">
          Your session has expired. Please log in again to continue.
        </p>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => setExpiredOpen(false)}>OK</Button>
        </div>
      </Modal>

      {/* Brand mark */}
      <div className="mb-8 flex flex-col items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-(--primary) text-(--primary-foreground) shadow-sm">
          <Briefcase className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-(--card-foreground)">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            Sign in to your JobTracker account
          </p>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-(--destructive)/30 bg-(--destructive)/10 px-4 py-3 text-sm text-(--destructive)">
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
        <div className="h-px flex-1 bg-(--auth-glass-border)" />
        <span className="text-xs text-(--muted-foreground)">or</span>
        <div className="h-px flex-1 bg-(--auth-glass-border)" />
      </div>

      <p className="text-center text-sm text-(--muted-foreground)">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-semibold text-(--primary) transition-opacity duration-150 hover:opacity-75 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring)"
        >
          Create one
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
