import { render, screen } from '@testing-library/react';
import ApplicationsPage from '@/app/(app)/applications/page';
import { isAuthenticated } from '@/lib/auth';

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

const mockIsAuthenticated = isAuthenticated as jest.Mock;

describe('ApplicationsPage', () => {
    beforeEach(() => {
        mockPush.mockClear();
        mockIsAuthenticated.mockReturnValue(true);
    });

    it('renders the page heading', () => {
        render(<ApplicationsPage />);
        expect(screen.getByRole('heading', { name: /applications/i })).toBeInTheDocument();
    });

    it('renders the ApplicationsTable component', () => {
        render(<ApplicationsPage />);
        expect(screen.getByTestId('applications-table')).toBeInTheDocument();
    });

    it('redirects to /login and renders nothing when not authenticated', () => {
        mockIsAuthenticated.mockReturnValue(false);
        render(<ApplicationsPage />);
        expect(mockPush).toHaveBeenCalledWith('/login');
        expect(screen.queryByRole('heading')).not.toBeInTheDocument();
        expect(screen.queryByTestId('applications-table')).not.toBeInTheDocument();
    });
});
