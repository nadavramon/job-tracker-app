'use client';

import { useState } from 'react';
import { getUsername } from '@/lib/auth';

interface HeaderProps {
    onMenuClick: () => void;
    title: string;
}

const IconMenu = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);

export default function Header({ onMenuClick, title }: HeaderProps) {
    const [username] = useState<string | null>(() => {
        if (typeof window === 'undefined') return null;
        return getUsername();
    });

    return (
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:hidden">
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    aria-label="Open mobile menu"
                >
                    <IconMenu />
                </button>
                <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            </div>
            {username && (
                <div className="text-sm font-medium text-muted-foreground truncate max-w-[120px]">
                    {username}
                </div>
            )}
        </header>
    );
}
