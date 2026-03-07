import { renderHook } from '@testing-library/react';
import { useTokenExpiry } from '@/lib/useTokenExpiry';
import { getTokenExpiry, removeToken, removeUsername, getToken } from '@/lib/auth';

jest.mock('@/lib/auth', () => ({
    getTokenExpiry: jest.fn(),
    getToken: jest.fn(),
    removeToken: jest.fn(),
    removeUsername: jest.fn(),
}));

const mockGetTokenExpiry = getTokenExpiry as jest.Mock;
const mockGetToken = getToken as jest.Mock;

beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockGetToken.mockReturnValue('fake-token');
});

afterEach(() => {
    jest.useRealTimers();
});

describe('useTokenExpiry', () => {
    it('schedules token cleanup when token has future expiry', () => {
        const expiresIn = 60_000;
        mockGetTokenExpiry.mockReturnValue(Date.now() + expiresIn);

        renderHook(() => useTokenExpiry());

        expect(removeToken).not.toHaveBeenCalled();

        jest.advanceTimersByTime(expiresIn + 100);

        expect(removeToken).toHaveBeenCalled();
        expect(removeUsername).toHaveBeenCalled();
    });

    it('cleans up immediately if token is already expired', () => {
        mockGetTokenExpiry.mockReturnValue(Date.now() - 1000);

        renderHook(() => useTokenExpiry());

        expect(removeToken).toHaveBeenCalled();
        expect(removeUsername).toHaveBeenCalled();
    });

    it('does nothing when there is no token expiry', () => {
        mockGetTokenExpiry.mockReturnValue(null);

        renderHook(() => useTokenExpiry());
        jest.advanceTimersByTime(100_000);

        expect(removeToken).not.toHaveBeenCalled();
    });

    it('checks expiry on visibility change to visible', () => {
        mockGetTokenExpiry.mockReturnValue(Date.now() + 60_000);

        renderHook(() => useTokenExpiry());

        // Simulate token expiring while tab was hidden
        mockGetTokenExpiry.mockReturnValue(Date.now() - 1000);

        Object.defineProperty(document, 'visibilityState', {
            value: 'visible',
            writable: true,
            configurable: true,
        });
        document.dispatchEvent(new Event('visibilitychange'));

        expect(removeToken).toHaveBeenCalled();
        expect(removeUsername).toHaveBeenCalled();
    });

    it('cleans up timer and listener on unmount', () => {
        mockGetTokenExpiry.mockReturnValue(Date.now() + 60_000);

        const { unmount } = renderHook(() => useTokenExpiry());
        unmount();

        jest.advanceTimersByTime(120_000);

        expect(removeToken).not.toHaveBeenCalled();
    });
});
