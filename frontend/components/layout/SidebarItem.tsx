'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarItemProps {
    href: string;
    label: string;
    icon: React.ReactNode;
    collapsed: boolean;
}

export default function SidebarItem({ href, label, icon, collapsed }: SidebarItemProps) {
    const pathname = usePathname();
    const isActive = pathname === href || (href !== '/' && pathname.startsWith(href + '/'));

    return (
        <Link
            href={href}
            title={collapsed ? label : undefined}
            aria-label={collapsed ? label : undefined}
            className={[
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
                isActive
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
                collapsed ? 'justify-center px-2' : '',
            ].join(' ')}
            aria-current={isActive ? 'page' : undefined}
        >
            <span className="shrink-0 h-5 w-5">{icon}</span>
            {!collapsed && <span className="truncate">{label}</span>}
        </Link>
    );
}
