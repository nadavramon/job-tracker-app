import { render, screen, fireEvent, act } from '@testing-library/react';
import OfflineBanner from '@/components/layout/OfflineBanner';

function setOnlineStatus(online: boolean) {
    Object.defineProperty(navigator, 'onLine', {
        get: () => online,
        configurable: true,
    });
}

describe('OfflineBanner', () => {
    beforeEach(() => {
        setOnlineStatus(true);
    });

    afterEach(() => {
        setOnlineStatus(true);
    });

    it('renders nothing when online', () => {
        setOnlineStatus(true);
        const { container } = render(<OfflineBanner />);
        expect(container).toBeEmptyDOMElement();
    });

    it('shows the banner when offline', () => {
        setOnlineStatus(false);
        render(<OfflineBanner />);
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/offline/i)).toBeInTheDocument();
        expect(screen.getByText(/changes will not be saved/i)).toBeInTheDocument();
    });

    it('shows a Retry button when offline', () => {
        setOnlineStatus(false);
        render(<OfflineBanner />);
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('hides the banner when connection is restored', () => {
        setOnlineStatus(false);
        render(<OfflineBanner />);
        expect(screen.getByRole('alert')).toBeInTheDocument();

        act(() => {
            setOnlineStatus(true);
            window.dispatchEvent(new Event('online'));
        });

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('shows the banner when going offline', () => {
        setOnlineStatus(true);
        render(<OfflineBanner />);
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();

        act(() => {
            setOnlineStatus(false);
            window.dispatchEvent(new Event('offline'));
        });

        expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('Retry button invokes the onRetry callback', () => {
        setOnlineStatus(false);
        const onRetry = jest.fn();
        render(<OfflineBanner onRetry={onRetry} />);
        fireEvent.click(screen.getByRole('button', { name: /retry/i }));
        expect(onRetry).toHaveBeenCalledTimes(1);
    });
});
