'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sun, Moon, Monitor } from 'lucide-react';
import { isAuthenticated, getUsername } from '@/lib/auth';
import { useTheme } from '@/context/ThemeContext';
import { useMounted } from '@/lib/useMounted';
import { getProfile } from '@/lib/userService';
import ProfileSection from '@/components/settings/ProfileSection';
import ApiKeySection from '@/components/settings/ApiKeySection';
import AccountSection from '@/components/settings/AccountSection';

interface ThemeOption {
    value: 'light' | 'dark' | 'system';
    label: string;
    description: string;
    Icon: React.ComponentType<{ className?: string }>;
}

const THEME_OPTIONS: ThemeOption[] = [
    { value: 'light', label: 'Light', description: 'Always use the light theme', Icon: Sun },
    { value: 'dark',  label: 'Dark',  description: 'Always use the dark theme', Icon: Moon },
    { value: 'system', label: 'System', description: 'Follow your device preference', Icon: Monitor },
];

export default function SettingsPage() {
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const mounted = useMounted();
    const username = mounted ? (getUsername() ?? '') : '';
    const [hasApiKey, setHasApiKey] = useState(false);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        getProfile().then((p) => setHasApiKey(p.hasApiKey)).catch(() => {});
    }, [router]);

    const handleApiKeyUpdated = useCallback((configured: boolean) => {
        setHasApiKey(configured);
    }, []);

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-8 animate-[fade-in_0.3s_ease-out]">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Settings</h1>

            <section aria-labelledby="profile-heading">
                <ProfileSection />
            </section>

            <section aria-labelledby="appearance-heading">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
                    <h2 id="appearance-heading" className="text-base font-semibold text-[var(--foreground)]">
                        Appearance
                    </h2>
                    <p className="text-sm text-[var(--muted-foreground)]">
                        Choose how the interface looks. Changes apply immediately.
                    </p>

                    <fieldset>
                        <legend className="sr-only">Theme</legend>
                        <div className="space-y-2">
                            {THEME_OPTIONS.map(({ value, label, description, Icon }) => (
                                <label
                                    key={value}
                                    className={[
                                        'flex items-center gap-4 rounded-lg border px-4 py-3 cursor-pointer transition-colors',
                                        mounted && theme === value
                                            ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                                            : 'border-[var(--border)] hover:bg-[var(--muted)]',
                                    ].join(' ')}
                                >
                                    <input
                                        type="radio"
                                        name="theme"
                                        value={value}
                                        checked={mounted && theme === value}
                                        onChange={() => setTheme(value)}
                                        className="accent-[var(--primary)]"
                                    />
                                    <Icon className="h-4 w-4 text-[var(--muted-foreground)]" aria-hidden="true" />
                                    <div>
                                        <p className="text-sm font-medium text-[var(--foreground)]">{label}</p>
                                        <p className="text-xs text-[var(--muted-foreground)]">{description}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </fieldset>
                </div>
            </section>

            <section aria-labelledby="ai-heading">
                <ApiKeySection hasApiKey={hasApiKey} onUpdated={handleApiKeyUpdated} />
            </section>

            {username && (
                <section>
                    <AccountSection username={username} />
                </section>
            )}
        </div>
    );
}
