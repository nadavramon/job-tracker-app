import { renderHook, act, waitFor } from '@testing-library/react';
import useApplicationsData from '@/hooks/useApplicationsData';
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
    pageOverrides: Partial<PagedResponse<Application>['page']> = {},
): PagedResponse<Application> => ({
    content: apps,
    page: {
        totalElements: apps.length,
        totalPages: 1,
        number: 0,
        size: 20,
        ...pageOverrides,
    },
});

describe('useApplicationsData', () => {
    beforeEach(() => jest.clearAllMocks());

    it('fetches data on mount with default parameters', async () => {
        mockGetApplications.mockResolvedValue(makePage([makeApp()]));
        const { result } = renderHook(() => useApplicationsData());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(mockGetApplications).toHaveBeenCalledWith(0, 20, 'appliedDate,desc', undefined, undefined);
        expect(result.current.data?.content).toHaveLength(1);
        expect(result.current.error).toBe('');
    });

    it('sets error state on fetch failure', async () => {
        mockGetApplications.mockRejectedValue(new Error('Network error'));
        const { result } = renderHook(() => useApplicationsData());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.error).toBe('Failed to load applications. Please try again.');
        expect(result.current.data).toBeNull();
    });

    it('re-fetches when search changes', async () => {
        mockGetApplications.mockResolvedValue(makePage([makeApp()]));
        const { result } = renderHook(() => useApplicationsData());

        await waitFor(() => expect(result.current.loading).toBe(false));
        mockGetApplications.mockClear();
        mockGetApplications.mockResolvedValue(makePage([]));

        act(() => result.current.handleSearchChange('Google'));

        await waitFor(() =>
            expect(mockGetApplications).toHaveBeenCalledWith(0, 20, 'appliedDate,desc', 'Google', undefined),
        );
    });

    it('re-fetches when status filter changes', async () => {
        mockGetApplications.mockResolvedValue(makePage([makeApp()]));
        const { result } = renderHook(() => useApplicationsData());

        await waitFor(() => expect(result.current.loading).toBe(false));
        mockGetApplications.mockClear();
        mockGetApplications.mockResolvedValue(makePage([]));

        act(() => result.current.handleStatusFilterChange({
            target: { value: 'OFFER' },
        } as React.ChangeEvent<HTMLSelectElement>));

        await waitFor(() =>
            expect(mockGetApplications).toHaveBeenCalledWith(0, 20, 'appliedDate,desc', undefined, 'OFFER'),
        );
    });

    it('re-fetches when sort direction toggles', async () => {
        mockGetApplications.mockResolvedValue(makePage([makeApp()]));
        const { result } = renderHook(() => useApplicationsData());

        await waitFor(() => expect(result.current.loading).toBe(false));
        mockGetApplications.mockClear();
        mockGetApplications.mockResolvedValue(makePage([makeApp()]));

        act(() => result.current.handleSortToggle());

        await waitFor(() =>
            expect(mockGetApplications).toHaveBeenCalledWith(0, 20, 'appliedDate,asc', undefined, undefined),
        );
        expect(result.current.sortDir).toBe('asc');
    });

    it('re-fetches when page size changes', async () => {
        mockGetApplications.mockResolvedValue(makePage([makeApp()]));
        const { result } = renderHook(() => useApplicationsData());

        await waitFor(() => expect(result.current.loading).toBe(false));
        mockGetApplications.mockClear();
        mockGetApplications.mockResolvedValue(makePage([makeApp()], { size: 10 }));

        act(() => result.current.handlePageSizeChange({
            target: { value: '10' },
        } as React.ChangeEvent<HTMLSelectElement>));

        await waitFor(() =>
            expect(mockGetApplications).toHaveBeenCalledWith(0, 10, 'appliedDate,desc', undefined, undefined),
        );
    });

    it('re-fetches when page changes', async () => {
        mockGetApplications.mockResolvedValue(makePage([makeApp()], { totalPages: 3 }));
        const { result } = renderHook(() => useApplicationsData());

        await waitFor(() => expect(result.current.loading).toBe(false));
        mockGetApplications.mockClear();
        mockGetApplications.mockResolvedValue(makePage([makeApp()], { number: 1, totalPages: 3 }));

        act(() => result.current.handlePageChange(1));

        await waitFor(() =>
            expect(mockGetApplications).toHaveBeenCalledWith(1, 20, 'appliedDate,desc', undefined, undefined),
        );
    });

    it('resets page to 0 when search changes', async () => {
        mockGetApplications.mockResolvedValue(makePage([makeApp()], { totalPages: 3 }));
        const { result } = renderHook(() => useApplicationsData());

        await waitFor(() => expect(result.current.loading).toBe(false));

        // Navigate to page 1
        act(() => result.current.handlePageChange(1));
        await waitFor(() => expect(result.current.page).toBe(1));

        mockGetApplications.mockClear();
        mockGetApplications.mockResolvedValue(makePage([]));

        act(() => result.current.handleSearchChange('test'));

        expect(result.current.page).toBe(0);
    });

    it('handleDeleteConfirm deletes and calls onDataChange', async () => {
        const onDataChange = jest.fn();
        mockDeleteApplication.mockResolvedValue(undefined);
        mockGetApplications.mockResolvedValue(makePage([
            makeApp({ id: '1', companyName: 'Acme Corp' }),
            makeApp({ id: '2', companyName: 'Beta Inc' }),
        ], { totalElements: 2 }));

        const { result } = renderHook(() => useApplicationsData({ onDataChange }));
        await waitFor(() => expect(result.current.loading).toBe(false));

        // Set pending delete
        act(() => result.current.setPendingDeleteApp(makeApp({ id: '1' })));

        await act(async () => {
            await result.current.handleDeleteConfirm();
        });

        expect(mockDeleteApplication).toHaveBeenCalledWith('1');
        expect(result.current.data?.content).toHaveLength(1);
        expect(result.current.data?.content[0].id).toBe('2');
        expect(result.current.pendingDeleteApp).toBeNull();
        expect(mockToast.success).toHaveBeenCalledWith('Application deleted');
        expect(onDataChange).toHaveBeenCalled();
    });

    it('handleDeleteConfirm shows error toast on failure', async () => {
        mockDeleteApplication.mockRejectedValue(new Error('Server error'));
        mockGetApplications.mockResolvedValue(makePage([makeApp()]));

        const { result } = renderHook(() => useApplicationsData());
        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => result.current.setPendingDeleteApp(makeApp()));

        await act(async () => {
            await result.current.handleDeleteConfirm();
        });

        expect(mockToast.error).toHaveBeenCalled();
        expect(result.current.pendingDeleteApp).toBeNull();
        expect(result.current.data?.content).toHaveLength(1);
    });

    it('handleDeleteCancel clears pendingDeleteApp', async () => {
        mockGetApplications.mockResolvedValue(makePage([makeApp()]));
        const { result } = renderHook(() => useApplicationsData());
        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => result.current.setPendingDeleteApp(makeApp()));
        expect(result.current.pendingDeleteApp).not.toBeNull();

        act(() => result.current.handleDeleteCancel());
        expect(result.current.pendingDeleteApp).toBeNull();
    });

    it('handleRowStatusChange updates local data and calls onDataChange', async () => {
        const onDataChange = jest.fn();
        mockGetApplications.mockResolvedValue(makePage([makeApp({ id: '1', status: 'APPLIED' })]));

        const { result } = renderHook(() => useApplicationsData({ onDataChange }));
        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => result.current.handleRowStatusChange('1', 'OFFER'));

        expect(result.current.data?.content[0].status).toBe('OFFER');
        expect(onDataChange).toHaveBeenCalled();
    });

    it('handleEditSaved updates local data and calls onDataChange', async () => {
        const onDataChange = jest.fn();
        mockGetApplications.mockResolvedValue(makePage([makeApp({ id: '1', companyName: 'Acme Corp' })]));

        const { result } = renderHook(() => useApplicationsData({ onDataChange }));
        await waitFor(() => expect(result.current.loading).toBe(false));

        const updated = makeApp({ id: '1', companyName: 'Acme Updated' });
        act(() => result.current.handleEditSaved(updated));

        expect(result.current.data?.content[0].companyName).toBe('Acme Updated');
        expect(onDataChange).toHaveBeenCalled();
    });

    it('retry re-fetches with current parameters', async () => {
        mockGetApplications.mockRejectedValue(new Error('fail'));
        const { result } = renderHook(() => useApplicationsData());
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.error).toBeTruthy();
        mockGetApplications.mockClear();
        mockGetApplications.mockResolvedValue(makePage([makeApp()]));

        await act(async () => {
            result.current.retry();
        });

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.data?.content).toHaveLength(1);
        expect(result.current.error).toBe('');
    });

    it('does nothing when handleDeleteConfirm is called without pendingDeleteApp', async () => {
        mockGetApplications.mockResolvedValue(makePage([makeApp()]));
        const { result } = renderHook(() => useApplicationsData());
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.handleDeleteConfirm();
        });

        expect(mockDeleteApplication).not.toHaveBeenCalled();
    });
});
