'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getUsername, removeUsername } from '@/lib/auth';
import { logout } from '@/lib/authService';
import { useMounted } from '@/hooks/useMounted';
import SidebarItem from './SidebarItem';
import { NAV_ITEMS, IconUser, IconLogout } from './navItems';

const STORAGE_KEY = 'sidebar-collapsed';

export default function Sidebar() {
    const mounted = useMounted();
    const router = useRouter();
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

    const handleLogout = useCallback(async () => {
        removeUsername();
        try { await logout(); } catch { /* cookie clear failed — already cleaned up locally */ }
        router.push('/login');
    }, [router]);

    return (
        <aside
            className={[
                'hidden md:flex flex-col shrink-0 h-screen sticky top-0',
                'bg-[var(--card)] border-r border-[var(--border)] shadow-sm',
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
                    {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-1">
                {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                    <SidebarItem
                        key={href}
                        href={href}
                        label={label}
                        icon={<Icon className="h-5 w-5" />}
                        collapsed={collapsed}
                        siblingHrefs={NAV_ITEMS.map(n => n.href)}
                    />
                ))}
            </nav>

            {/* User section */}
            <div className="shrink-0 border-t border-[var(--border)] px-2 py-3 flex flex-col gap-2">
                <div className={[
                    'flex items-center gap-3',
                    collapsed ? 'justify-center' : '',
                ].join(' ')}>
                    <span
                        className="shrink-0 text-[var(--muted-foreground)]"
                        aria-hidden="true"
                    >
                        <IconUser className="h-5 w-5" />
                    </span>
                    {!collapsed && username && (
                        <span className="text-sm text-[var(--muted-foreground)] truncate">{username}</span>
                    )}
                </div>
                <button
                    onClick={handleLogout}
                    title={collapsed ? 'Log out' : undefined}
                    aria-label="Log out"
                    className={[
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
                        collapsed ? 'justify-center px-2' : '',
                    ].join(' ')}
                >
                    <IconLogout className="shrink-0 h-5 w-5" />
                    {!collapsed && <span className="truncate">Log out</span>}
                </button>
            </div>
        </aside>
    );
}
