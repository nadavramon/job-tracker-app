import { isAuthenticated, setUsername, getUsername, removeUsername } from '@/lib/auth';

beforeEach(() => {
    localStorage.clear();
});

describe('isAuthenticated', () => {
    it('returns false when no username is stored', () => {
        expect(isAuthenticated()).toBe(false);
    });

    it('returns true when a username is stored', () => {
        localStorage.setItem('username', 'testuser');
        expect(isAuthenticated()).toBe(true);
    });
});

describe('username helpers', () => {
    it('setUsername stores and getUsername retrieves', () => {
        setUsername('alice');
        expect(getUsername()).toBe('alice');
    });

    it('removeUsername clears the stored username', () => {
        setUsername('alice');
        removeUsername();
        expect(getUsername()).toBeNull();
    });
});
