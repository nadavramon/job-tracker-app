'use client';

import { useCallback, useEffect, useState } from 'react';
import { deleteApplication, getApplications } from '@/lib/applicationService';
import { JOB_TYPE_LABELS } from '@/lib/constants';
import { Application, PagedResponse, Status } from '@/types';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/errorMessages';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EditModal from '@/components/applications/EditModal';
import ApplicationCard from '@/components/applications/ApplicationCard';
import Pagination from '@/components/ui/Pagination';
import SearchInput from '@/components/ui/SearchInput';
import Spinner from '@/components/ui/Spinner';
import CredentialCell from '@/components/applications/CredentialCell';
import RowActionMenu from '@/components/applications/RowActionMenu';
import StatusHint from '@/components/applications/StatusHint';
import StatusSelect from '@/components/applications/StatusSelect';

type SortDir = 'asc' | 'desc';
type PageSize = 10 | 20 | 50;

const STATUS_OPTIONS: { value: Status; label: string }[] = [
    { value: 'APPLIED',      label: 'Applied' },
    { value: 'SCREENING',    label: 'Screening' },
    { value: 'INTERVIEWING', label: 'Interviewing' },
    { value: 'OFFER',        label: 'Offer' },
    { value: 'REJECTED',     label: 'Rejected' },
    { value: 'WITHDRAWN',    label: 'Withdrawn' },
];

const selectCls = [
    'rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]',
    'text-sm px-3 py-2 outline-none transition-colors appearance-none',
    'focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]/30',
].join(' ');

const thCls =
    'px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]';
const tdCls = 'px-4 py-3 text-sm text-[var(--foreground)] whitespace-nowrap';

interface ApplicationsTableProps {
    onDataChange?: () => void;
}

export default function ApplicationsTable({ onDataChange }: ApplicationsTableProps) {
    const { toast } = useToast();

    const [page, setPage]               = useState(0);
    const [pageSize, setPageSize]       = useState<PageSize>(20);
    const [sortDir, setSortDir]         = useState<SortDir>('desc');
    const [search, setSearch]           = useState('');
    const [statusFilter, setStatusFilter] = useState<Status | ''>('');
    const [data, setData]               = useState<PagedResponse<Application> | null>(null);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState('');
    const [pendingDeleteApp, setPendingDeleteApp] = useState<Application | null>(null);
    const [deleting, setDeleting]       = useState(false);
    const [editingApp, setEditingApp]   = useState<Application | null>(null);

    const fetchPage = useCallback(async (
        p: number,
        sz: number,
        sort: string,
        srch: string,
        status: string,
    ) => {
        setLoading(true);
        setError('');
        try {
            const result = await getApplications(
                p, sz, sort,
                srch || undefined,
                status || undefined,
            );
            setData(result);
        } catch {
            setError('Failed to load applications. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPage(page, pageSize, `appliedDate,${sortDir}`, search, statusFilter);
    }, [page, pageSize, sortDir, search, statusFilter, fetchPage]);

    const handleSearchChange = useCallback((val: string) => {
        setSearch(val);
        setPage(0);
    }, []);

    const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setStatusFilter(e.target.value as Status | '');
        setPage(0);
    }, []);

    const handleSortToggle = useCallback(() => {
        setSortDir(prev => (prev === 'desc' ? 'asc' : 'desc'));
        setPage(0);
    }, []);

    const handlePageSizeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setPageSize(Number(e.target.value) as PageSize);
        setPage(0);
    }, []);

    const handlePageChange = useCallback((p: number) => {
        setPage(p);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!pendingDeleteApp) return;
        setDeleting(true);
        try {
            await deleteApplication(pendingDeleteApp.id);
            setData(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    content: prev.content.filter(a => a.id !== pendingDeleteApp.id),
                    page: { ...prev.page, totalElements: prev.page.totalElements - 1 },
                };
            });
            toast.success('Application deleted');
            setPendingDeleteApp(null);
            onDataChange?.();
        } catch (error) {
            toast.error(getErrorMessage(error));
            setPendingDeleteApp(null);
        } finally {
            setDeleting(false);
        }
    }, [pendingDeleteApp, toast, onDataChange]);

    const handleDeleteCancel = useCallback(() => {
        setPendingDeleteApp(null);
    }, []);

    const handleRowStatusChange = useCallback((id: string, newStatus: Status) => {
        setData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                content: prev.content.map(app =>
                    app.id === id ? { ...app, status: newStatus } : app,
                ),
            };
        });
        onDataChange?.();
    }, [onDataChange]);

    const handleEditSaved = useCallback((updated: Application) => {
        setData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                content: prev.content.map(app => app.id === updated.id ? updated : app),
            };
        });
        onDataChange?.();
    }, [onDataChange]);

    return (
        <>
        <div className="space-y-4">
            {/* Controls bar */}
            <div className="flex flex-wrap items-center gap-3">
                <SearchInput
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Search companies…"
                    className="flex-1 min-w-[180px]"
                />

                <select
                    value={statusFilter}
                    onChange={handleStatusChange}
                    aria-label="Filter by status"
                    className={selectCls}
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23737373' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.6rem center',
                        backgroundSize: '1rem',
                        paddingRight: '2.25rem',
                    }}
                >
                    <option value="">All Statuses</option>
                    {STATUS_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>

                <button
                    onClick={handleSortToggle}
                    aria-label={`Sort by applied date ${sortDir === 'desc' ? 'ascending' : 'descending'}`}
                    className={[
                        'inline-flex items-center gap-1.5 rounded-md border border-[var(--border)]',
                        'bg-[var(--background)] text-[var(--foreground)] text-sm px-3 py-2',
                        'hover:bg-[var(--muted)] transition-colors whitespace-nowrap',
                    ].join(' ')}
                >
                    Applied Date {sortDir === 'desc' ? '↓' : '↑'}
                </button>
            </div>

            {/* Table area */}
            {loading && (
                <div className="flex items-center justify-center py-16">
                    <Spinner size="lg" />
                </div>
            )}

            {!loading && error && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
                    <p className="text-sm text-[var(--muted-foreground)] mb-3">{error}</p>
                    <button
                        onClick={() => fetchPage(page, pageSize, `appliedDate,${sortDir}`, search, statusFilter)}
                        className="text-sm font-medium text-[var(--primary)] hover:underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            {!loading && !error && (!data || data.page.totalElements === 0) && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
                    <p className="text-[var(--muted-foreground)]">No applications yet.</p>
                </div>
            )}

            {!loading && !error && data && data.page.totalElements > 0 && (
                <>
                    {/* Desktop table */}
                    <div className="hidden md:block rounded-xl md:rounded-b-none border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-[var(--border)]">
                                <thead className="bg-[var(--muted)]/40">
                                    <tr>
                                        <th className={thCls}>Company</th>
                                        <th className={thCls}>Role</th>
                                        <th className={thCls}>Status</th>
                                        <th className={thCls}>Applied Date</th>
                                        <th className={thCls}>Location</th>
                                        <th className={thCls}>Job Type</th>
                                        <th className={thCls}>Credentials</th>
                                        <th className={thCls}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {data.content.map((app) => (
                                        <tr
                                            key={app.id}
                                            className="hover:bg-[var(--muted)]/30 transition-colors"
                                        >
                                            <td className={`${tdCls} font-medium`}>
                                                <span className="flex items-center gap-1.5">
                                                    <StatusHint status={app.status} appliedDate={app.appliedDate} />
                                                    {app.companyName}
                                                </span>
                                            </td>
                                            <td className={tdCls}>{app.jobRole}</td>
                                            <td className={tdCls}>
                                                <StatusSelect
                                                    applicationId={app.id}
                                                    status={app.status}
                                                    onStatusChange={handleRowStatusChange}
                                                />
                                            </td>
                                            <td className={tdCls}>{app.appliedDate}</td>
                                            <td className={`${tdCls} text-[var(--muted-foreground)]`}>
                                                {app.location}
                                            </td>
                                            <td className={`${tdCls} text-[var(--muted-foreground)]`}>
                                                {JOB_TYPE_LABELS[app.jobType]}
                                            </td>
                                            <td className={tdCls}>
                                                <CredentialCell
                                                    username={app.username}
                                                    password={app.password}
                                                />
                                            </td>
                                            <td className={tdCls}>
                                                <RowActionMenu
                                                    websiteLink={app.websiteLink}
                                                    onEdit={() => setEditingApp(app)}
                                                    onDelete={() => setPendingDeleteApp(app)}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile card list */}
                    <div className="md:hidden flex flex-col gap-3">
                        {data.content.map((app) => (
                            <ApplicationCard
                                key={app.id}
                                application={app}
                                onEdit={() => setEditingApp(app)}
                                onDelete={() => setPendingDeleteApp(app)}
                            />
                        ))}
                    </div>

                    {/* Shared footer: page size selector + pagination */}
                    <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 md:mt-0 md:rounded-none md:rounded-b-xl md:border-t-0">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                                <label htmlFor="page-size-select">Rows per page:</label>
                                <select
                                    id="page-size-select"
                                    value={pageSize}
                                    onChange={handlePageSizeChange}
                                    aria-label="Rows per page"
                                    className={[
                                        'rounded-md border border-[var(--border)] bg-[var(--background)]',
                                        'text-[var(--foreground)] text-sm px-2 py-1 outline-none',
                                        'focus:border-[var(--primary)]',
                                    ].join(' ')}
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>

                            {data.page.totalPages > 1 && (
                                <Pagination
                                    page={data.page.number}
                                    totalPages={data.page.totalPages}
                                    totalElements={data.page.totalElements}
                                    pageSize={data.page.size}
                                    onPageChange={handlePageChange}
                                />
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>

        <ConfirmDialog
            open={pendingDeleteApp !== null}
            onClose={handleDeleteCancel}
            onConfirm={handleDeleteConfirm}
            title="Delete application"
            message={`Are you sure you want to delete the application at ${pendingDeleteApp?.companyName}?`}
            confirmLabel="Delete"
            loading={deleting}
        />

        <EditModal
            application={editingApp}
            onClose={() => setEditingApp(null)}
            onSaved={handleEditSaved}
        />
        </>
    );
}
