'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getToken } from '@/lib/auth';
import { updateProfile, getProfile } from '@/lib/userService';

// Internal lowercase type (maps to backend's 'LIGHT' | 'DARK' | 'SYSTEM')
type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    resolvedTheme: 'light' | 'dark';
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// A helper to apply the dark class
function applyTheme(theme: Theme) {
    const isDark =
        theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    return isDark ? 'dark' : 'light';
}


// Theme provider logic -
function ThemeProvider({ children }: { children: React.ReactNode }) {

    // State
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window === 'undefined') return 'system';
        return (localStorage.getItem('theme') as Theme) || 'system';
    });
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window === 'undefined') return 'light';
        const stored = (localStorage.getItem('theme') as Theme) || 'system';
        return applyTheme(stored);
    });

    // setTheme function (exposed via context)
    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('theme', newTheme);
        const resolved = applyTheme(newTheme);
        setResolvedTheme(resolved);

        // Sync to backend if logged in (fire-and-forget)
        if (getToken()) {
            updateProfile({
                themePreference: newTheme.toUpperCase() as 'LIGHT' | 'DARK' | 'SYSTEM'
            }).catch(() => { });
        }
    }, []);

    // System preference listener useEffect:
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handler = () => {
            if (theme === 'system') {
                const resolved = applyTheme('system');
                setResolvedTheme(resolved);
            }
        };

        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [theme]);

    // Backend preference fallback (runs once on mount)
    useEffect(() => {
        const stored = localStorage.getItem('theme');
        // Only fetch from backend if no localStorage value AND user is logged in
        if (!stored && getToken()) {
            getProfile()
                .then((profile) => {
                    const backendTheme = profile.themePreference.toLowerCase() as Theme;
                    setThemeState(backendTheme);
                    localStorage.setItem('theme', backendTheme);
                    const resolved = applyTheme(backendTheme);
                    setResolvedTheme(resolved);
                })
                .catch(() => {
                    // Backend unavailable — stay with 'system' default
                });
        }
    }, []);

    // Return the provider
    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

// Export the hook
export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

export { ThemeProvider };
