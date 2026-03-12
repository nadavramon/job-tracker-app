'use client';

import { useCallback, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import MobileDrawer from '@/components/layout/MobileDrawer';
const ROUTE_TITLES: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/applications': 'Applications',
    '/applications/new': 'New Application',
    '/settings': 'Settings',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const menuTriggerRef = useRef<Element | null>(null);
    const pathname = usePathname();
    const title = ROUTE_TITLES[pathname] ?? 'Job Tracker';

    const openMenu = useCallback(() => {
        menuTriggerRef.current = document.activeElement;
        setIsMobileMenuOpen(true);
    }, []);

    const closeMenu = useCallback(() => {
        setIsMobileMenuOpen(false);
        (menuTriggerRef.current as HTMLElement)?.focus();
    }, []);

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Mobile Drawer */}
            <MobileDrawer
                isOpen={isMobileMenuOpen}
                onClose={closeMenu}
            />

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Mobile Header */}
                <Header
                    onMenuClick={openMenu}
                    title={title}
                />

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
