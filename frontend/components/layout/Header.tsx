'use client';

import { Menu } from 'lucide-react';
import { getUsername } from '@/lib/auth';
import { useMounted } from '@/hooks/useMounted';

interface HeaderProps {
    onMenuClick: () => void;
    title: string;
}

export default function Header({ onMenuClick, title }: HeaderProps) {
    const mounted = useMounted();
    const username = mounted ? getUsername() : null;

    return (
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-(--border) bg-(--card) px-4 shadow-sm md:hidden">
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className="rounded-md p-1.5 text-(--muted-foreground) hover:bg-(--muted) hover:text-(--foreground) transition-colors"
                    aria-label="Open mobile menu"
                >
                    <Menu className="h-6 w-6" />
                </button>
                <h1 className="text-lg font-semibold text-(--foreground)">{title}</h1>
            </div>
            {username && (
                <div className="text-sm font-medium text-(--muted-foreground) truncate max-w-[120px]">
                    {username}
                </div>
            )}
        </header>
    );
}
