import { LayoutDashboard, List, PlusCircle, Settings, User, LogOut } from 'lucide-react';

export { User as IconUser, LogOut as IconLogout };

export const NAV_ITEMS: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/applications', label: 'Applications', icon: List },
    { href: '/applications/new', label: 'New Application', icon: PlusCircle },
    { href: '/settings', label: 'Settings', icon: Settings },
];
