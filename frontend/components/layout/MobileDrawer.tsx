'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { getUsername, removeUsername } from '@/lib/auth';
import { logout } from '@/lib/authService';
import { useMounted } from '@/hooks/useMounted';
import SidebarItem from './SidebarItem';
import { NAV_ITEMS, IconUser, IconLogout } from './navItems';

interface MobileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

const FOCUSABLE_SELECTORS = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
    const mounted = useMounted();
    const router = useRouter();
    const username = mounted ? getUsername() : null;

    const handleLogout = useCallback(async () => {
        removeUsername();
        try { await logout(); } catch { /* cookie clear failed — already cleaned up locally */ }
        onClose();
        router.push('/login');
    }, [onClose, router]);

    const drawerRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    // Body scroll lock — only set overflow:hidden when open; cleanup always restores it.
    // The else branch is intentionally absent: the component unmounts when isOpen is false,
    // so only the cleanup fires on close, which is sufficient.
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Focus management: move focus into the drawer on open, trap Tab, close on Escape.
    useEffect(() => {
        if (!isOpen) return;

        closeButtonRef.current?.focus();

        const drawerEl = drawerRef.current;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
                return;
            }
            if (e.key === 'Tab' && drawerEl) {
                const focusable = Array.from(
                    drawerEl.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
                );
                if (focusable.length === 0) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey) {
                    if (document.activeElement === first) {
                        e.preventDefault();
                        last.focus();
                    }
                } else {
                    if (document.activeElement === last) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                aria-hidden="true"
                onClick={onClose}
            />

            {/* Drawer panel */}
            <div
                ref={drawerRef}
                role="dialog"
                aria-modal="true"
                aria-label="Navigation menu"
                className="relative flex w-64 flex-col bg-[var(--card)] shadow-xl h-full border-r border-[var(--border)] animate-[slide-in-left_0.2s_ease-out]"
            >
                <div className="flex items-center justify-between h-14 px-4 border-b border-[var(--border)] shrink-0">
                    <span className="font-semibold text-sm text-[var(--foreground)] truncate">
                        Job Tracker
                    </span>
                    <button
                        ref={closeButtonRef}
                        onClick={onClose}
                        aria-label="Close menu"
                        className="rounded-md p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-1">
                    {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                        <SidebarItem
                            key={href}
                            href={href}
                            label={label}
                            icon={<Icon className="h-5 w-5" />}
                            collapsed={false}
                            onClick={onClose}
                            siblingHrefs={NAV_ITEMS.map(n => n.href)}
                        />
                    ))}
                </nav>

                <div className="shrink-0 border-t border-[var(--border)] px-4 py-4 flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <span className="shrink-0 text-[var(--muted-foreground)]" aria-hidden="true">
                            <IconUser className="h-5 w-5" />
                        </span>
                        {username && (
                            <span className="text-sm font-medium text-[var(--muted-foreground)] truncate">{username}</span>
                        )}
                    </div>
                    <button
                        onClick={handleLogout}
                        className={[
                            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                            'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
                        ].join(' ')}
                    >
                        <IconLogout className="shrink-0 h-5 w-5" />
                        <span className="truncate">Log out</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
