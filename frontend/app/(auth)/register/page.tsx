'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Briefcase, CircleAlert } from 'lucide-react';
import { register } from '@/lib/authService';
import { setUsername as persistUsername } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errorMessages';
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
    <>
      {/* Brand mark */}
      <div className="mb-8 flex flex-col items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-(--primary) text-(--primary-foreground) shadow-sm">
          <Briefcase className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-(--card-foreground)">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            Start tracking your job applications
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
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <Input
          variant="glass"
          label="Username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          error={fieldErrors.username}
          required
        />
        <Input
          variant="glass"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          error={fieldErrors.password}
          required
        />
        <Button variant="glass" type="submit" loading={loading} size="lg" className="mt-1 w-full">
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3" aria-hidden="true">
        <div className="h-px flex-1 bg-(--auth-glass-border)" />
        <span className="text-xs text-(--muted-foreground)">or</span>
        <div className="h-px flex-1 bg-(--auth-glass-border)" />
      </div>

      <p className="text-center text-sm text-(--muted-foreground)">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-semibold text-(--primary) transition-opacity duration-150 hover:opacity-75 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring)"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
