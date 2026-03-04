import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import ApplicationsTable from '@/components/applications/ApplicationsTable';
import { deleteApplication, getApplications } from '@/lib/applicationService';
import { Application, PagedResponse } from '@/types';

jest.mock('@/lib/applicationService', () => ({
    getApplications: jest.fn(),
    deleteApplication: jest.fn(),
}));

const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
};

jest.mock('@/context/ToastContext', () => ({
    useToast: () => ({ toast: mockToast }),
}));

jest.mock('@/components/applications/StatusSelect', () => {
    const STATUS_LABELS: Record<string, string> = {
        APPLIED: 'Applied', SCREENING: 'Screening', INTERVIEWING: 'Interviewing',
        OFFER: 'Offer', REJECTED: 'Rejected', WITHDRAWN: 'Withdrawn',
    };
    return function StatusSelect({ status }: { status: string }) {
        return <span>{STATUS_LABELS[status] ?? status}</span>;
    };
});

const mockGetApplications = getApplications as jest.Mock;
const mockDeleteApplication = deleteApplication as jest.Mock;

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

    // --- Loading / Error / Empty states ---

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
            makeApp({ id: '2', companyName: 'Beta Inc',  jobRole: 'Designer', status: 'OFFER', appliedDate: '2026-02-01', location: 'London' }),
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
        await waitFor(() => expect(screen.getAllByText('••••••••').length).toBeGreaterThanOrEqual(1));
    });

    it('shows dash in credentials column when no credentials', async () => {
        mockGetApplications.mockResolvedValue(
            makePage([makeApp({ username: null, password: null })]),
        );
        render(<ApplicationsTable />);
        await waitFor(() => screen.getByText('Acme Corp'));
        expect(screen.getByText('—')).toBeInTheDocument();
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

    it('calls getApplications with defaults on mount', async () => {
        mockGetApplications.mockResolvedValue(makePage([makeApp()]));
        render(<ApplicationsTable />);
        await waitFor(() => screen.getByText('Acme Corp'));
        expect(mockGetApplications).toHaveBeenCalledWith(0, 20, 'appliedDate,desc', undefined, undefined);
    });

    // --- Controls bar ---

    it('renders search input, status filter, and sort toggle', () => {
        mockGetApplications.mockReturnValue(new Promise(() => {}));
        render(<ApplicationsTable />);
        expect(screen.getByRole('searchbox')).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: /filter by status/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sort by applied date/i })).toBeInTheDocument();
    });

    it('renders rows-per-page selector in the table footer', async () => {
        mockGetApplications.mockResolvedValue(makePage([makeApp()]));
        render(<ApplicationsTable />);
        await waitFor(() => screen.getByText('Acme Corp'));
        expect(screen.getByRole('combobox', { name: /rows per page/i })).toBeInTheDocument();
    });

    it('re-fetches with status param when status filter changes', async () => {
        mockGetApplications.mockResolvedValue(makePage([makeApp()]));
        render(<ApplicationsTable />);
        await waitFor(() => screen.getByText('Acme Corp'));

        mockGetApplications.mockClear();
        mockGetApplications.mockResolvedValue(makePage([]));

        fireEvent.change(screen.getByRole('combobox', { name: /filter by status/i }), {
            target: { value: 'OFFER' },
        });

        await waitFor(() =>
            expect(mockGetApplications).toHaveBeenCalledWith(0, 20, 'appliedDate,desc', undefined, 'OFFER'),
        );
    });

    it('re-fetches with asc sort after sort toggle click', async () => {
        mockGetApplications.mockResolvedValue(makePage([makeApp()]));
        render(<ApplicationsTable />);
        await waitFor(() => screen.getByText('Acme Corp'));

        mockGetApplications.mockClear();
        mockGetApplications.mockResolvedValue(makePage([makeApp()]));

        fireEvent.click(screen.getByRole('button', { name: /sort by applied date ascending/i }));

        await waitFor(() =>
            expect(mockGetApplications).toHaveBeenCalledWith(0, 20, 'appliedDate,asc', undefined, undefined),
        );
    });

    it('re-fetches with new page size when rows-per-page changes', async () => {
        mockGetApplications.mockResolvedValue(makePage([makeApp()]));
        render(<ApplicationsTable />);
        await waitFor(() => screen.getByText('Acme Corp'));

        mockGetApplications.mockClear();
        mockGetApplications.mockResolvedValue(makePage([makeApp()], { size: 10 }));

        fireEvent.change(screen.getByRole('combobox', { name: /rows per page/i }), {
            target: { value: '10' },
        });

        await waitFor(() =>
            expect(mockGetApplications).toHaveBeenCalledWith(0, 10, 'appliedDate,desc', undefined, undefined),
        );
    });

    it('resets to page 0 when status filter changes', async () => {
        // Start on page 1 by simulating multi-page data
        const apps = Array.from({ length: 20 }, (_, i) =>
            makeApp({ id: String(i), companyName: `Company ${i}` }),
        );
        mockGetApplications.mockResolvedValue(
            makePage(apps, { totalPages: 3, totalElements: 60, number: 0 }),
        );
        render(<ApplicationsTable />);
        await waitFor(() => screen.getByRole('button', { name: /next page/i }));

        // Navigate to page 1
        mockGetApplications.mockClear();
        mockGetApplications.mockResolvedValue(
            makePage(apps, { totalPages: 3, totalElements: 60, number: 1 }),
        );
        fireEvent.click(screen.getByRole('button', { name: /next page/i }));
        await waitFor(() =>
            expect(mockGetApplications).toHaveBeenCalledWith(1, 20, 'appliedDate,desc', undefined, undefined),
        );

        // Change status filter — should reset to page 0
        mockGetApplications.mockClear();
        mockGetApplications.mockResolvedValue(makePage([]));
        fireEvent.change(screen.getByRole('combobox', { name: /filter by status/i }), {
            target: { value: 'REJECTED' },
        });
        await waitFor(() =>
            expect(mockGetApplications).toHaveBeenCalledWith(0, 20, 'appliedDate,desc', undefined, 'REJECTED'),
        );
    });

    it('shows search input with correct placeholder', () => {
        mockGetApplications.mockReturnValue(new Promise(() => {}));
        render(<ApplicationsTable />);
        expect(screen.getByPlaceholderText(/search companies/i)).toBeInTheDocument();
    });

    it('re-fetches with search term after debounce fires', async () => {
        jest.useFakeTimers();
        try {
            mockGetApplications.mockResolvedValue(makePage([makeApp()]));
            render(<ApplicationsTable />);

            // Flush initial fetch
            await act(async () => { jest.runAllTimers(); });
            await act(async () => {});
            await waitFor(() => screen.getByText('Acme Corp'));

            mockGetApplications.mockClear();
            mockGetApplications.mockResolvedValue(makePage([]));

            fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Google' } });
            act(() => { jest.advanceTimersByTime(300); });
            await act(async () => {});

            expect(mockGetApplications).toHaveBeenCalledWith(0, 20, 'appliedDate,desc', 'Google', undefined);
        } finally {
            jest.useRealTimers();
        }
    });

    // --- Delete confirmation ---

    it('opens confirm dialog with the correct company name when Delete is clicked', async () => {
        mockGetApplications.mockResolvedValue(makePage([makeApp({ companyName: 'Acme Corp' })]));
        render(<ApplicationsTable />);
        await waitFor(() => screen.getByText('Acme Corp'));

        fireEvent.click(screen.getByRole('button', { name: 'Row actions' }));
        fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/delete the application at Acme Corp/i)).toBeInTheDocument();
    });

    it('does not call deleteApplication when Cancel is clicked', async () => {
        mockGetApplications.mockResolvedValue(makePage([makeApp()]));
        render(<ApplicationsTable />);
        await waitFor(() => screen.getByText('Acme Corp'));

        fireEvent.click(screen.getByRole('button', { name: 'Row actions' }));
        fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

        expect(mockDeleteApplication).not.toHaveBeenCalled();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('calls deleteApplication with the correct id on confirm', async () => {
        mockDeleteApplication.mockResolvedValue(undefined);
        mockGetApplications.mockResolvedValue(makePage([makeApp({ id: 'app-42' })]));
        render(<ApplicationsTable />);
        await waitFor(() => screen.getByText('Acme Corp'));

        fireEvent.click(screen.getByRole('button', { name: 'Row actions' }));
        fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
        fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

        await waitFor(() => expect(mockDeleteApplication).toHaveBeenCalledWith('app-42'));
    });

    it('removes the row from the table after successful delete', async () => {
        mockDeleteApplication.mockResolvedValue(undefined);
        mockGetApplications.mockResolvedValue(makePage([
            makeApp({ id: '1', companyName: 'Acme Corp' }),
            makeApp({ id: '2', companyName: 'Beta Inc' }),
        ], { totalElements: 2 }));
        render(<ApplicationsTable />);
        await waitFor(() => screen.getByText('Acme Corp'));

        fireEvent.click(screen.getAllByRole('button', { name: 'Row actions' })[0]);
        fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
        fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

        await waitFor(() => expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument());
        expect(screen.getByText('Beta Inc')).toBeInTheDocument();
    });

    it('closes the dialog and keeps the row on delete failure', async () => {
        mockDeleteApplication.mockRejectedValue(new Error('Server error'));
        mockGetApplications.mockResolvedValue(makePage([makeApp({ companyName: 'Acme Corp' })]));
        render(<ApplicationsTable />);
        await waitFor(() => screen.getByText('Acme Corp'));

        fireEvent.click(screen.getByRole('button', { name: 'Row actions' }));
        fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
        fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
        expect(mockToast.error).toHaveBeenCalledTimes(1);
    });
});
