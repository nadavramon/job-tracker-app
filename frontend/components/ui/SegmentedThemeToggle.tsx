'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useMounted } from '@/hooks/useMounted';

type Segment = {
    value: 'light' | 'dark' | 'system';
    label: string;
    icon: React.ReactNode;
};

const SEGMENTS: Segment[] = [
    { value: 'light',  label: 'Light',  icon: <Sun  className="h-4 w-4" /> },
    { value: 'dark',   label: 'Dark',   icon: <Moon className="h-4 w-4" /> },
    { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> },
];

const INDICATOR_TRANSLATE: Record<'light' | 'dark' | 'system', string> = {
    light:  'translate-x-0',
    dark:   'translate-x-full',
    system: 'translate-x-[200%]',
};

export default function SegmentedThemeToggle() {
    const { theme, setTheme } = useTheme();
    const mounted = useMounted();

    if (!mounted) {
        return (
            <div className="h-9 w-56 rounded-full bg-[var(--auth-glass-bg)] border border-[var(--auth-glass-border)]" />
        );
    }

    return (
        <div className="relative flex items-center rounded-full bg-[var(--auth-glass-bg)] border border-[var(--auth-glass-border)] p-0.5">
            {/* Sliding indicator */}
            <div
                className={`
                    absolute top-0.5 bottom-0.5 left-0.5
                    w-[calc(33.333%-2px)] rounded-full
                    bg-[var(--muted)]
                    transition-transform duration-200 ease-in-out
                    ${INDICATOR_TRANSLATE[theme]}
                `}
            />

            {/* Segments */}
            {SEGMENTS.map(({ value, label, icon }) => (
                <button
                    key={value}
                    type="button"
                    onClick={() => setTheme(value)}
                    className={`
                        relative z-10 flex items-center gap-1.5
                        py-1.5 px-3 rounded-full
                        text-xs font-medium
                        transition-colors duration-200
                        w-1/3 justify-center
                        ${theme === value
                            ? 'text-[var(--foreground)]'
                            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                        }
                    `}
                >
                    {icon}
                    {label}
                </button>
            ))}
        </div>
    );
}
