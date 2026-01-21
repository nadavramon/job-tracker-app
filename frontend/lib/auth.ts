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