'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Briefcase, CircleAlert } from 'lucide-react';
import { register } from '@/lib/authService';
import { setUsername as persistUsername } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errorMessages';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const next = { username: '', password: '' };
    if (username.length < 3 || username.length > 14) {
      next.username = 'Username must be 3–14 characters.';
    }
    if (password.length < 8 || password.length > 14) {
      next.password = 'Password must be 8–14 characters.';
    }
    setFieldErrors(next);
    return !next.username && !next.password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);

    try {
      const response = await register({ email, username, password });
      persistUsername(response.username);
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

      {/* Auth card */}
      <div className="relative mx-4 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-xl shadow-black/5 dark:shadow-black/30 animate-[fade-in_0.4s_ease-out]">

        {/* Brand mark */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm">
            <Briefcase className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--card-foreground)]">
              Create your account
            </h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Start tracking your job applications
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
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <Input
            label="Username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            error={fieldErrors.username}
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            error={fieldErrors.password}
            required
          />
          <Button type="submit" loading={loading} size="lg" className="mt-1 w-full">
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3" aria-hidden="true">
          <div className="h-px flex-1 bg-[var(--border)]" />
          <span className="text-xs text-[var(--muted-foreground)]">or</span>
          <div className="h-px flex-1 bg-[var(--border)]" />
        </div>

        <p className="text-center text-sm text-[var(--muted-foreground)]">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-[var(--primary)] transition-opacity duration-150 hover:opacity-75 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
