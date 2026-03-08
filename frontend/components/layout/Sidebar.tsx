'use client';

import { useCallback, useState } from 'react';
import { getUsername } from '@/lib/auth';
import { useMounted } from '@/lib/useMounted';
import SidebarItem from './SidebarItem';
import { NAV_ITEMS, IconUser } from './navItems';

const STORAGE_KEY = 'sidebar-collapsed';

// --- Icons (Sidebar-only: collapse toggles) ---

const IconChevronLeft = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
    </svg>
);

const IconChevronRight = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
    </svg>
);

// --- Sidebar ---

export default function Sidebar() {
    const mounted = useMounted();
    const [collapsed, setCollapsed] = useState(() =>
        typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY) === 'true'
    );
    const username = mounted ? getUsername() : null;

    const toggle = useCallback(() => {
        setCollapsed(prev => {
            const next = !prev;
            localStorage.setItem(STORAGE_KEY, String(next));
            return next;
        });
    }, []);

    return (
        <aside
            className={[
                'hidden md:flex flex-col shrink-0 h-screen sticky top-0',
                'bg-[var(--card)] border-r border-[var(--border)]',
                'transition-[width] duration-200 ease-in-out',
                collapsed ? 'w-16' : 'w-60',
            ].join(' ')}
            aria-label="Main navigation"
        >
            {/* Logo / brand row */}
            <div className={[
                'flex items-center h-14 border-b border-[var(--border)] px-3 shrink-0',
                collapsed ? 'justify-center' : 'justify-between',
            ].join(' ')}>
                {!collapsed && (
                    <span className="font-semibold text-sm text-[var(--foreground)] truncate">
                        Job Tracker
                    </span>
                )}
                <button
                    onClick={toggle}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    className="rounded-md p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                    {collapsed ? <IconChevronRight /> : <IconChevronLeft />}
                </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-1">
                {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                    <SidebarItem
                        key={href}
                        href={href}
                        label={label}
                        icon={<Icon />}
                        collapsed={collapsed}
                    />
                ))}
            </nav>

            {/* User section */}
            <div className={[
                'shrink-0 border-t border-[var(--border)] px-2 py-3',
                'flex items-center gap-3',
                collapsed ? 'justify-center' : '',
            ].join(' ')}>
                <span
                    className="shrink-0 h-5 w-5 text-[var(--muted-foreground)]"
                    aria-hidden="true"
                >
                    <IconUser />
                </span>
                {!collapsed && username && (
                    <span className="text-sm text-[var(--muted-foreground)] truncate">{username}</span>
                )}
            </div>
        </aside>
    );
}
