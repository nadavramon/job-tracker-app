'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarItemProps {
    href: string;
    label: string;
    icon: React.ReactNode;
    collapsed: boolean;
    onClick?: () => void;
    siblingHrefs?: string[];
}

export default function SidebarItem({ href, label, icon, collapsed, onClick, siblingHrefs = [] }: SidebarItemProps) {
    const pathname = usePathname();
    const exactMatch = pathname === href;
    const prefixMatch = href !== '/' && pathname.startsWith(href + '/');
    // Don't use prefix matching if the pathname exactly matches another nav item
    const isActive = exactMatch || (prefixMatch && !siblingHrefs.some(h => h === pathname));

    return (
        <Link
            href={href}
            onClick={onClick}
            title={collapsed ? label : undefined}
            aria-label={collapsed ? label : undefined}
            className={[
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
                isActive
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm'
                    : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
                collapsed ? 'justify-center px-2' : '',
            ].join(' ')}
            aria-current={isActive ? 'page' : undefined}
        >
            <span className="shrink-0">{icon}</span>
            {!collapsed && <span className="truncate">{label}</span>}
        </Link>
    );
}
