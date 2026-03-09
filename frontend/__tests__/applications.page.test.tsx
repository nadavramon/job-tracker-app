import { render, screen } from '@testing-library/react';
import ApplicationsPage from '@/app/(app)/applications/page';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
    usePathname: () => '/applications',
}));

jest.mock('@/components/applications/ApplicationsTable', () => {
    return function MockApplicationsTable() {
        return <div data-testid="applications-table" />;
    };
});

jest.mock('@/lib/auth', () => ({
    isAuthenticated: jest.fn(() => true),
}));

describe('ApplicationsPage', () => {
    beforeEach(() => {
        mockPush.mockClear();
    });

    it('renders the page heading', () => {
        render(<ApplicationsPage />);
        expect(screen.getByRole('heading', { name: /applications/i })).toBeInTheDocument();
    });

    it('renders the ApplicationsTable component', () => {
        render(<ApplicationsPage />);
        expect(screen.getByTestId('applications-table')).toBeInTheDocument();
    });

    it('redirects to /login when not authenticated', () => {
        const { isAuthenticated } = require('@/lib/auth');
        (isAuthenticated as jest.Mock).mockReturnValueOnce(false);
        render(<ApplicationsPage />);
        expect(mockPush).toHaveBeenCalledWith('/login');
    });
});
