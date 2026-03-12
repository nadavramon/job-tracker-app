// Helper functions for managing authentication

// Quick check if user is logged in (cookie carries the JWT; username in localStorage signals active session)
export const isAuthenticated = (): boolean => {
    return getUsername() !== null;
};

// Saves username to localStorage after login/register
export const setUsername = (username: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('username', username);
};

// Retrieves the stored username (SSR-safe)
export const getUsername = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('username');
};

// Clears username on logout
export const removeUsername = (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('username');
};
