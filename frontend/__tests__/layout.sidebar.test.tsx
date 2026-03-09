import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '@/components/layout/Sidebar';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
    usePathname: () => '/dashboard',
    useRouter: () => ({ push: mockPush }),
}));

describe('Sidebar', () => {
    beforeEach(() => {
        localStorage.clear();
        mockPush.mockClear();
    });

    it('renders all nav items', () => {
        render(<Sidebar />);
        expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /^applications$/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /new application/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument();
    });

    it('renders a log out button', () => {
        render(<Sidebar />);
        expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
    });

    it('clears auth and redirects to /login when log out is clicked', () => {
        localStorage.setItem('token', 'test-token');
        localStorage.setItem('username', 'testuser');
        render(<Sidebar />);

        fireEvent.click(screen.getByRole('button', { name: /log out/i }));

        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('username')).toBeNull();
        expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('renders the username from localStorage', () => {
        localStorage.setItem('username', 'sidebartestuser');
        render(<Sidebar />);
        expect(screen.getByText('sidebartestuser')).toBeInTheDocument();
    });

    it('shows collapse/expand toggle', () => {
        render(<Sidebar />);
        expect(screen.getByRole('button', { name: /collapse sidebar/i })).toBeInTheDocument();
    });
});
