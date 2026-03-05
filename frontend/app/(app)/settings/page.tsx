'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { useTheme } from '@/context/ThemeContext';
import ProfileSection from '@/components/settings/ProfileSection';

type ThemeOption = { value: 'light' | 'dark' | 'system'; label: string; description: string };

const THEME_OPTIONS: ThemeOption[] = [
    { value: 'light', label: 'Light', description: 'Always use the light theme' },
    { value: 'dark',  label: 'Dark',  description: 'Always use the dark theme' },
    { value: 'system', label: 'System', description: 'Follow your device preference' },
];

export default function SettingsPage() {
    const router = useRouter();
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
        }
    }, [router]);

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
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
                            {THEME_OPTIONS.map(({ value, label, description }) => (
                                <label
                                    key={value}
                                    className={[
                                        'flex items-center gap-4 rounded-lg border px-4 py-3 cursor-pointer transition-colors',
                                        theme === value
                                            ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                                            : 'border-[var(--border)] hover:bg-[var(--muted)]',
                                    ].join(' ')}
                                >
                                    <input
                                        type="radio"
                                        name="theme"
                                        value={value}
                                        checked={theme === value}
                                        onChange={() => setTheme(value)}
                                        className="accent-[var(--primary)]"
                                    />
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
        </div>
    );
}
