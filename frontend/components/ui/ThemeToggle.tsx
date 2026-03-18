'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useMounted } from '@/lib/useMounted';

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const mounted = useMounted();

    const cycleTheme = () => {
        if (theme === 'light') setTheme('dark');
        else if (theme === 'dark') setTheme('system');
        else setTheme('light');
    };

    if (!mounted) {
        return <div className="rounded-md p-2 h-9 w-9" />;
    }

    return (
        <button
            onClick={cycleTheme}
            className="rounded-md p-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            aria-label={`Current theme: ${theme}`}
            title={`Theme: ${theme}`}
        >
            {theme === 'light' && <Sun className="h-5 w-5" />}
            {theme === 'dark' && <Moon className="h-5 w-5" />}
            {theme === 'system' && <Monitor className="h-5 w-5" />}
        </button>
    );
}
