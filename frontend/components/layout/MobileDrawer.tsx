'use client';

import { useEffect, useState } from 'react';
import { getUsername } from '@/lib/auth';
import SidebarItem from './SidebarItem';

interface MobileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

const IconClose = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const IconDashboard = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v2.5A2.25 2.25 0 004.25 9h2.5A2.25 2.25 0 009 6.75v-2.5A2.25 2.25 0 006.75 2h-2.5zm0 9A2.25 2.25 0 002 13.25v2.5A2.25 2.25 0 004.25 18h2.5A2.25 2.25 0 009 15.75v-2.5A2.25 2.25 0 006.75 11h-2.5zm6.5-9A2.25 2.25 0 008.5 4.25v2.5A2.25 2.25 0 0010.75 9h2.5A2.25 2.25 0 0015.5 6.75v-2.5A2.25 2.25 0 0013.25 2h-2.5zm0 9a2.25 2.25 0 00-2.25 2.25v2.5a2.25 2.25 0 002.25 2.25h2.5a2.25 2.25 0 002.25-2.25v-2.5a2.25 2.25 0 00-2.25-2.25h-2.5z" clipRule="evenodd" />
    </svg>
);

const IconPlus = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
    </svg>
);

const IconSettings = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.295 1.473c.497.144.971.342 1.416.587l1.25-.834a1 1 0 011.262.125l1.668 1.668a1 1 0 01.125 1.262l-.834 1.25c.245.445.443.919.587 1.416l1.473.294a1 1 0 01.804.98v2.361a1 1 0 01-.804.98l-1.473.295a6.95 6.95 0 01-.587 1.416l.834 1.25a1 1 0 01-.125 1.262l-1.668 1.668a1 1 0 01-1.262.125l-1.25-.834a6.953 6.953 0 01-1.416.587l-.294 1.473a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.295-1.473a6.957 6.957 0 01-1.416-.587l-1.25.834a1 1 0 01-1.262-.125L1.95 15.349a1 1 0 01-.125-1.262l.834-1.25a6.957 6.957 0 01-.587-1.416l-1.473-.294A1 1 0 010 11.18V8.82a1 1 0 01.804-.98l1.473-.295c.144-.497.342-.971.587-1.416l-.834-1.25a1 1 0 01.125-1.262L3.823 1.95a1 1 0 011.262-.125l1.25.834a6.957 6.957 0 011.416-.587L7.84 1.804zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
);

const IconUser = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
    </svg>
);

const NAV_ITEMS = [
    { href: '/dashboard', label: 'Dashboard', icon: IconDashboard },
    { href: '/applications/new', label: 'New Application', icon: IconPlus },
    { href: '/settings', label: 'Settings', icon: IconSettings },
];

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
    const [username] = useState<string | null>(() => {
        if (typeof window === 'undefined') return null;
        return getUsername();
    });

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 transition-opacity" aria-hidden="true" onClick={onClose} />

            {/* Drawer */}
            <div className="relative flex w-64 flex-col bg-card shadow-xl h-full border-r border-border">
                <div className="flex items-center justify-between h-14 px-4 border-b border-border shrink-0">
                    <span className="font-semibold text-sm text-foreground truncate">
                        Job Tracker
                    </span>
                    <button
                        onClick={onClose}
                        aria-label="Close menu"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                        <IconClose />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-1">
                    {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                        <div key={href} onClick={onClose}>
                            <SidebarItem href={href} label={label} icon={<Icon />} collapsed={false} />
                        </div>
                    ))}
                </nav>

                <div className="shrink-0 border-t border-border px-4 py-4 flex items-center gap-3">
                    <span className="shrink-0 h-5 w-5 text-muted-foreground" aria-hidden="true">
                        <IconUser />
                    </span>
                    {username && (
                        <span className="text-sm font-medium text-muted-foreground truncate">{username}</span>
                    )}
                </div>
            </div>
        </div>
    );
}
