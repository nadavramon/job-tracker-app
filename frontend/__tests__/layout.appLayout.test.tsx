/* eslint-disable react/display-name */
import { render, screen, fireEvent } from '@testing-library/react';
import AppLayout from '@/app/(app)/layout';

// Mock child components to isolate AppLayout logic
jest.mock('@/components/layout/Sidebar', () => () => <aside data-testid="sidebar" />);
jest.mock('@/components/layout/Header', () => ({ onMenuClick, title }: { onMenuClick: () => void; title: string }) => (
    <div data-testid="header">
        <button onClick={onMenuClick} aria-label="Open mobile menu">menu</button>
        <span>{title}</span>
    </div>
));
jest.mock('@/components/layout/MobileDrawer', () => ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    isOpen ? (
        <div data-testid="mobile-drawer">
            <button onClick={onClose} aria-label="Close menu">close</button>
        </div>
    ) : null
));
jest.mock('next/navigation', () => ({
    usePathname: jest.fn(() => '/dashboard'),
}));

import { usePathname } from 'next/navigation';
const mockUsePathname = usePathname as jest.Mock;

describe('AppLayout', () => {
    beforeEach(() => {
        mockUsePathname.mockReturnValue('/dashboard');
    });

    it('renders the sidebar and header', () => {
        render(<AppLayout><div>content</div></AppLayout>);
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
        expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('renders children inside main', () => {
        render(<AppLayout><p>page content</p></AppLayout>);
        expect(screen.getByRole('main')).toContainElement(screen.getByText('page content'));
    });

    it('does not render MobileDrawer by default', () => {
        render(<AppLayout><div /></AppLayout>);
        expect(screen.queryByTestId('mobile-drawer')).not.toBeInTheDocument();
    });

    it('opens MobileDrawer when hamburger is clicked', () => {
        render(<AppLayout><div /></AppLayout>);
        fireEvent.click(screen.getByRole('button', { name: 'Open mobile menu' }));
        expect(screen.getByTestId('mobile-drawer')).toBeInTheDocument();
    });

    it('closes MobileDrawer when onClose is called', () => {
        render(<AppLayout><div /></AppLayout>);
        fireEvent.click(screen.getByRole('button', { name: 'Open mobile menu' }));
        expect(screen.getByTestId('mobile-drawer')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Close menu' }));
        expect(screen.queryByTestId('mobile-drawer')).not.toBeInTheDocument();
    });

    it('passes "Dashboard" as title for /dashboard route', () => {
        mockUsePathname.mockReturnValue('/dashboard');
        render(<AppLayout><div /></AppLayout>);
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('passes "New Application" as title for /applications/new route', () => {
        mockUsePathname.mockReturnValue('/applications/new');
        render(<AppLayout><div /></AppLayout>);
        expect(screen.getByText('New Application')).toBeInTheDocument();
    });

    it('passes "Settings" as title for /settings route', () => {
        mockUsePathname.mockReturnValue('/settings');
        render(<AppLayout><div /></AppLayout>);
        expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('falls back to "Job Tracker" for unknown routes', () => {
        mockUsePathname.mockReturnValue('/unknown-route');
        render(<AppLayout><div /></AppLayout>);
        expect(screen.getByText('Job Tracker')).toBeInTheDocument();
    });
});
