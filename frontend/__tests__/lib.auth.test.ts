import { getTokenExpiry, isTokenExpired } from '@/lib/auth';

// Helper to create a fake JWT with a given exp claim
function fakeJwt(payload: Record<string, unknown>): string {
    const header = btoa(JSON.stringify({ alg: 'HS256' }));
    const body = btoa(JSON.stringify(payload));
    return `${header}.${body}.signature`;
}

beforeEach(() => {
    localStorage.clear();
});

describe('getTokenExpiry', () => {
    it('returns expiry in ms from a valid JWT', () => {
        const exp = Math.floor(Date.now() / 1000) + 3600; // 1h from now
        localStorage.setItem('token', fakeJwt({ exp }));
        expect(getTokenExpiry()).toBe(exp * 1000);
    });

    it('returns null when no token exists', () => {
        expect(getTokenExpiry()).toBeNull();
    });

    it('returns null for a malformed token', () => {
        localStorage.setItem('token', 'not-a-jwt');
        expect(getTokenExpiry()).toBeNull();
    });

    it('returns null when exp claim is missing', () => {
        localStorage.setItem('token', fakeJwt({ sub: 'user' }));
        expect(getTokenExpiry()).toBeNull();
    });
});

describe('isTokenExpired', () => {
    it('returns false for a non-expired token', () => {
        const exp = Math.floor(Date.now() / 1000) + 3600;
        localStorage.setItem('token', fakeJwt({ exp }));
        expect(isTokenExpired()).toBe(false);
    });

    it('returns true for an expired token', () => {
        const exp = Math.floor(Date.now() / 1000) - 60;
        localStorage.setItem('token', fakeJwt({ exp }));
        expect(isTokenExpired()).toBe(true);
    });

    it('returns true when no token exists', () => {
        expect(isTokenExpired()).toBe(true);
    });
});
