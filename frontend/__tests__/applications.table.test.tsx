import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ApplicationsTable from '@/components/applications/ApplicationsTable';
import { getApplications } from '@/lib/applicationService';
import { Application, PagedResponse } from '@/types';

jest.mock('@/lib/applicationService', () => ({
    getApplications: jest.fn(),
}));

const mockGetApplications = getApplications as jest.Mock;

const makeApp = (overrides: Partial<Application> = {}): Application => ({
    id: '1',
    companyName: 'Acme Corp',
    jobRole: 'Software Engineer',
    status: 'APPLIED',
    appliedDate: '2026-01-15',
    location: 'Remote',
    jobType: 'FULL_TIME',
    statusChangedDate: null,
    websiteLink: null,
    username: null,
    password: null,
    ...overrides,
});

const makePage = (
    apps: Application[],
    overrides: Partial<PagedResponse<Application>> = {},
): PagedResponse<Application> => ({
    content: apps,
    totalElements: apps.length,
    totalPages: 1,
    number: 0,
    size: 20,
    first: true,
    last: true,
    ...overrides,
});

describe('ApplicationsTable', () => {
    beforeEach(() => jest.clearAllMocks());

    it('shows loading spinner initially', () => {
        mockGetApplications.mockReturnValue(new Promise(() => {}));
        render(<ApplicationsTable />);
        expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
    });

    it('renders all column headers after load', async () => {
        mockGetApplications.mockResolvedValue(makePage([makeApp()]));
        render(<ApplicationsTable />);
        await waitFor(() =>
            expect(screen.getByRole('columnheader', { name: /company/i })).toBeInTheDocument(),
        );
        expect(screen.getByRole('columnheader', { name: /role/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /applied date/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /location/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /job type/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /credentials/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();
    });

    it('renders application row data', async () => {
        const apps = [
            makeApp({ id: '1', companyName: 'Acme Corp', jobRole: 'Engineer', appliedDate: '2026-01-15', location: 'Remote' }),
            makeApp({ id: '2', companyName: 'Beta Inc', jobRole: 'Designer', status: 'OFFER', appliedDate: '2026-02-01', location: 'London' }),
        ];
        mockGetApplications.mockResolvedValue(makePage(apps, { totalElements: 2 }));
        render(<ApplicationsTable />);
        await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument());
        expect(screen.getByText('Beta Inc')).toBeInTheDocument();
        expect(screen.getByText('Engineer')).toBeInTheDocument();
        expect(screen.getByText('Designer')).toBeInTheDocument();
        expect(screen.getByText('Remote')).toBeInTheDocument();
        expect(screen.getByText('London')).toBeInTheDocument();
    });

    it('renders status badges for each row', async () => {
        const apps = [
            makeApp({ id: '1', status: 'APPLIED' }),
            makeApp({ id: '2', status: 'OFFER' }),
        ];
        mockGetApplications.mockResolvedValue(makePage(apps, { totalElements: 2 }));
        render(<ApplicationsTable />);
        await waitFor(() => expect(screen.getByText('Applied')).toBeInTheDocument());
        expect(screen.getByText('Offer')).toBeInTheDocument();
    });

    it('maps job type enum to human-readable label', async () => {
        mockGetApplications.mockResolvedValue(makePage([makeApp({ jobType: 'FULL_TIME' })]));
        render(<ApplicationsTable />);
        await waitFor(() => expect(screen.getByText('Full-time')).toBeInTheDocument());
    });

    it('shows masked credentials when username or password is present', async () => {
        mockGetApplications.mockResolvedValue(
            makePage([makeApp({ username: 'user123', password: 'secret' })]),
        );
        render(<ApplicationsTable />);
        await waitFor(() => expect(screen.getByText('••••••••')).toBeInTheDocument());
    });

    it('shows dash in credentials column when no credentials', async () => {
        mockGetApplications.mockResolvedValue(
            makePage([makeApp({ username: null, password: null })]),
        );
        render(<ApplicationsTable />);
        await waitFor(() => screen.getByText('Acme Corp'));
        // Both credentials and actions columns show "—" when there are no credentials
        expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
    });

    it('shows empty state when no applications', async () => {
        mockGetApplications.mockResolvedValue(makePage([], { totalElements: 0 }));
        render(<ApplicationsTable />);
        await waitFor(() =>
            expect(screen.getByText(/no applications yet/i)).toBeInTheDocument(),
        );
    });

    it('shows error message and retry button on fetch failure', async () => {
        mockGetApplications.mockRejectedValue(new Error('Network error'));
        render(<ApplicationsTable />);
        await waitFor(() =>
            expect(screen.getByText(/failed to load applications/i)).toBeInTheDocument(),
        );
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('retries fetch when retry button is clicked', async () => {
        mockGetApplications
            .mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValue(makePage([makeApp()]));
        render(<ApplicationsTable />);
        await waitFor(() => screen.getByRole('button', { name: /retry/i }));
        fireEvent.click(screen.getByRole('button', { name: /retry/i }));
        await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument());
    });

    it('does not render pagination when only one page', async () => {
        mockGetApplications.mockResolvedValue(makePage([makeApp()], { totalPages: 1 }));
        render(<ApplicationsTable />);
        await waitFor(() => screen.getByText('Acme Corp'));
        expect(screen.queryByRole('button', { name: /previous page/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /next page/i })).not.toBeInTheDocument();
    });

    it('renders pagination controls when multiple pages exist', async () => {
        const apps = Array.from({ length: 20 }, (_, i) =>
            makeApp({ id: String(i), companyName: `Company ${i}` }),
        );
        mockGetApplications.mockResolvedValue(
            makePage(apps, { totalPages: 3, totalElements: 60, size: 20 }),
        );
        render(<ApplicationsTable />);
        await waitFor(() =>
            expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument(),
        );
        expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();
    });

    it('calls getApplications with page=0, size=20, sort on mount', async () => {
        mockGetApplications.mockResolvedValue(makePage([makeApp()]));
        render(<ApplicationsTable />);
        await waitFor(() => screen.getByText('Acme Corp'));
        expect(mockGetApplications).toHaveBeenCalledWith(0, 20, 'appliedDate,desc');
    });
});
