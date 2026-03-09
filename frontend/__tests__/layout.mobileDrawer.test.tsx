import { render, screen, fireEvent } from '@testing-library/react';
import MobileDrawer from '@/components/layout/MobileDrawer';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
    usePathname: () => '/dashboard',
    useRouter: () => ({ push: mockPush }),
}));

describe('MobileDrawer', () => {
    beforeEach(() => {
        localStorage.clear();
        mockPush.mockClear();
    });

    it('renders nothing when isOpen is false', () => {
        render(<MobileDrawer isOpen={false} onClose={jest.fn()} />);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders the drawer with correct ARIA attributes when open', () => {
        render(<MobileDrawer isOpen={true} onClose={jest.fn()} />);
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAttribute('aria-label', 'Navigation menu');
    });

    it('renders all nav items when open', () => {
        render(<MobileDrawer isOpen={true} onClose={jest.fn()} />);
        expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /^applications$/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /new application/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument();
    });

    it('calls onClose when the backdrop is clicked', () => {
        const onClose = jest.fn();
        render(<MobileDrawer isOpen={true} onClose={onClose} />);
        const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement;
        fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when the close (X) button is clicked', () => {
        const onClose = jest.fn();
        render(<MobileDrawer isOpen={true} onClose={onClose} />);
        fireEvent.click(screen.getByRole('button', { name: 'Close menu' }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key is pressed', () => {
        const onClose = jest.fn();
        render(<MobileDrawer isOpen={true} onClose={onClose} />);
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose on Escape when closed', () => {
        const onClose = jest.fn();
        render(<MobileDrawer isOpen={false} onClose={onClose} />);
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onClose).not.toHaveBeenCalled();
    });

    it('sets body overflow to hidden when open', () => {
        render(<MobileDrawer isOpen={true} onClose={jest.fn()} />);
        expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body overflow when unmounted', () => {
        const { unmount } = render(<MobileDrawer isOpen={true} onClose={jest.fn()} />);
        unmount();
        expect(document.body.style.overflow).toBe('');
    });

    it('focuses the close button on open', () => {
        render(<MobileDrawer isOpen={true} onClose={jest.fn()} />);
        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close menu' }));
    });

    it('calls onClose when a nav link is clicked', () => {
        const onClose = jest.fn();
        render(<MobileDrawer isOpen={true} onClose={onClose} />);
        fireEvent.click(screen.getByRole('link', { name: /dashboard/i }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('renders the username from localStorage when present', () => {
        localStorage.setItem('username', 'drawertestuser');
        render(<MobileDrawer isOpen={true} onClose={jest.fn()} />);
        expect(screen.getByText('drawertestuser')).toBeInTheDocument();
    });

    it('renders a log out button when open', () => {
        render(<MobileDrawer isOpen={true} onClose={jest.fn()} />);
        expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
    });

    it('clears auth and redirects to /login when log out is clicked', () => {
        localStorage.setItem('token', 'test-token');
        localStorage.setItem('username', 'testuser');
        const onClose = jest.fn();
        render(<MobileDrawer isOpen={true} onClose={onClose} />);

        fireEvent.click(screen.getByRole('button', { name: /log out/i }));

        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('username')).toBeNull();
        expect(onClose).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/login');
    });
});
