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
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] relative">
      <div className="absolute top-4 right-4">
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

      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-[var(--card-foreground)]">
          Login
        </h1>

        {error && (
          <div className="mb-4 rounded-md border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 px-4 py-3 text-sm text-[var(--destructive)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          <Button type="submit" loading={loading} size="lg" className="mt-2 w-full">
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-[var(--muted-foreground)]">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-[var(--primary)] hover:underline">
            Register
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
