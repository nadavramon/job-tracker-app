'use client';

import { Menu } from 'lucide-react';
import { getUsername } from '@/lib/auth';
import { useMounted } from '@/lib/useMounted';

interface HeaderProps {
    onMenuClick: () => void;
    title: string;
}

export default function Header({ onMenuClick, title }: HeaderProps) {
    const mounted = useMounted();
    const username = mounted ? getUsername() : null;

    return (
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-4 shadow-sm md:hidden">
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className="rounded-md p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                    aria-label="Open mobile menu"
                >
                    <Menu className="h-6 w-6" />
                </button>
                <h1 className="text-lg font-semibold text-[var(--foreground)]">{title}</h1>
            </div>
            {username && (
                <div className="text-sm font-medium text-[var(--muted-foreground)] truncate max-w-[120px]">
                    {username}
                </div>
            )}
        </header>
    );
}
