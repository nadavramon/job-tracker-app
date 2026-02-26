//Helper functions for managing authentication


//Saves JWT to localStorage after login
export const setToken = (token: string): void => {
    localStorage.setItem('token', token);
};

//Retrieves the token (with check for server side rendering)
export const getToken = (): string | null => {
    
    // Next.js renders on the server first, where localStorage does not exist
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
};

//Clears token on logout
export const removeToken = (): void => {
    localStorage.removeItem('token');
};

//Quick check if user is logged in
export const isAuthenticated = (): boolean => {
    return getToken() !== null;
};

//Saves username to localStorage after login/register
export const setUsername = (username: string): void => {
    localStorage.setItem('username', username);
};

//Retrieves the stored username (SSR-safe)
export const getUsername = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('username');
};

//Clears username on logout
export const removeUsername = (): void => {
    localStorage.removeItem('username');
};