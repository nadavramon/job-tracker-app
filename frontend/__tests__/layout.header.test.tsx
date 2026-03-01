import { render, screen, fireEvent } from '@testing-library/react';
import Header from '@/components/layout/Header';

// Suppress Next.js navigation mock noise
jest.mock('next/navigation', () => ({
    usePathname: () => '/dashboard',
}));

describe('Header', () => {
    it('renders the title', () => {
        render(<Header onMenuClick={jest.fn()} title="Dashboard" />);
        expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
    });

    it('renders the hamburger button with accessible label', () => {
        render(<Header onMenuClick={jest.fn()} title="Dashboard" />);
        expect(screen.getByRole('button', { name: 'Open mobile menu' })).toBeInTheDocument();
    });

    it('calls onMenuClick when the hamburger button is clicked', () => {
        const onMenuClick = jest.fn();
        render(<Header onMenuClick={onMenuClick} title="Dashboard" />);
        fireEvent.click(screen.getByRole('button', { name: 'Open mobile menu' }));
        expect(onMenuClick).toHaveBeenCalledTimes(1);
    });

    it('renders the username from localStorage when present', () => {
        localStorage.setItem('username', 'testuser');
        render(<Header onMenuClick={jest.fn()} title="Dashboard" />);
        expect(screen.getByText('testuser')).toBeInTheDocument();
        localStorage.removeItem('username');
    });

    it('does not render a username section when localStorage has no username', () => {
        localStorage.removeItem('username');
        render(<Header onMenuClick={jest.fn()} title="Dashboard" />);
        expect(screen.queryByText('testuser')).not.toBeInTheDocument();
    });
});
