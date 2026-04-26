import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

// Mock matchMedia (jsdom doesn't have it)
Object.defineProperty(window, 'matchMedia', {
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
    })),
});

// Helper component that exposes useTheme() values to the test
function ThemeConsumer() {
    const { theme, resolvedTheme, setTheme } = useTheme();
    return (
        <div>
            <span data-testid="theme">{theme}</span>
            <span data-testid="resolved">{resolvedTheme}</span>
            <button onClick={() => setTheme('dark')}>Set Dark</button>
            <button onClick={() => setTheme('light')}>Set Light</button>
        </div>
    );
}

describe('ThemeContext', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.classList.remove('dark');
    });

    it('defaults to system theme', () => {
        render(
            <ThemeProvider>
                <ThemeConsumer />
            </ThemeProvider>
        );
        expect(screen.getByTestId('theme').textContent).toBe('system');
    });

    it('setTheme dark adds dark class and saves to localStorage', () => {
        render(
            <ThemeProvider>
                <ThemeConsumer />
            </ThemeProvider>
        );

        act(() => {
            screen.getByText('Set Dark').click();
        });

        expect(localStorage.getItem('theme')).toBe('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(screen.getByTestId('theme').textContent).toBe('dark');
    });

    it('setTheme light removes dark class and saves to localStorage', () => {
        document.documentElement.classList.add('dark');

        render(
            <ThemeProvider>
                <ThemeConsumer />
            </ThemeProvider>
        );

        act(() => {
            screen.getByText('Set Light').click();
        });

        expect(localStorage.getItem('theme')).toBe('light');
        expect(document.documentElement.classList.contains('dark')).toBe(false);
        expect(screen.getByTestId('theme').textContent).toBe('light');
    });
});
