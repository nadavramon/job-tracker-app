import { render, screen, fireEvent } from '@testing-library/react';
import SettingsPage from '@/app/(app)/settings/page';

const mockSetTheme = jest.fn();
let mockTheme = 'system';

jest.mock('@/context/ThemeContext', () => ({
    useTheme: () => ({ theme: mockTheme, setTheme: mockSetTheme }),
}));

jest.mock('@/components/settings/ProfileSection', () => ({
    __esModule: true,
    default: () => null,
}));

jest.mock('@/components/settings/AccountSection', () => ({
    __esModule: true,
    default: () => null,
}));

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/lib/auth', () => ({
    isAuthenticated: jest.fn(() => true),
    getUsername: jest.fn(() => 'testuser'),
}));

import { isAuthenticated } from '@/lib/auth';
const mockIsAuthenticated = isAuthenticated as jest.Mock;

beforeEach(() => {
    jest.clearAllMocks();
    mockTheme = 'system';
    mockIsAuthenticated.mockReturnValue(true);
});

describe('SettingsPage — Appearance', () => {
    it('redirects to /login when not authenticated', () => {
        mockIsAuthenticated.mockReturnValueOnce(false);
        render(<SettingsPage />);
        expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('renders the Settings heading and Appearance section', () => {
        render(<SettingsPage />);
        expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /appearance/i })).toBeInTheDocument();
    });

    it('renders Light, Dark, and System radio options', () => {
        render(<SettingsPage />);
        expect(screen.getByRole('radio', { name: /light/i })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: /dark/i })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: /system/i })).toBeInTheDocument();
    });

    it('checks the radio matching the current theme', () => {
        mockTheme = 'dark';
        render(<SettingsPage />);
        expect(screen.getByRole('radio', { name: /dark/i })).toBeChecked();
        expect(screen.getByRole('radio', { name: /light/i })).not.toBeChecked();
        expect(screen.getByRole('radio', { name: /system/i })).not.toBeChecked();
    });

    it('calls setTheme with "light" when Light radio is selected', () => {
        render(<SettingsPage />);
        fireEvent.click(screen.getByRole('radio', { name: /light/i }));
        expect(mockSetTheme).toHaveBeenCalledWith('light');
    });

    it('calls setTheme with "dark" when Dark radio is selected', () => {
        render(<SettingsPage />);
        fireEvent.click(screen.getByRole('radio', { name: /dark/i }));
        expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('calls setTheme with "system" when System radio is selected', () => {
        mockTheme = 'light';
        render(<SettingsPage />);
        fireEvent.click(screen.getByRole('radio', { name: /system/i }));
        expect(mockSetTheme).toHaveBeenCalledWith('system');
    });
});
