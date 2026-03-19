'use client';

import { JOB_TYPE_LABELS } from '@/lib/constants';
import useApplicationsData from '@/hooks/useApplicationsData';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EditModal from '@/components/applications/EditModal';
import ApplicationCard from '@/components/applications/ApplicationCard';
import Spinner from '@/components/ui/Spinner';
import CredentialCell from '@/components/applications/CredentialCell';
import RowActionMenu from '@/components/applications/RowActionMenu';
import StatusHint from '@/components/applications/StatusHint';
import StatusSelect from '@/components/applications/StatusSelect';
import ApplicationsToolbar from '@/components/applications/ApplicationsToolbar';
import ApplicationsFooter from '@/components/applications/ApplicationsFooter';

const thCls =
    'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]';
const tdCls = 'px-4 py-3 text-sm text-[var(--foreground)] whitespace-nowrap';

interface ApplicationsTableProps {
    onDataChange?: () => void;
}

export default function ApplicationsTable({ onDataChange }: ApplicationsTableProps) {
    const {
        data,
        loading,
        error,
        pageSize,
        sortDir,
        search,
        statusFilter,
        pendingDeleteApp,
        setPendingDeleteApp,
        editingApp,
        setEditingApp,
        deleting,
        handleSearchChange,
        handleStatusFilterChange,
        handleSortToggle,
        handlePageSizeChange,
        handlePageChange,
        handleDeleteConfirm,
        handleDeleteCancel,
        handleRowStatusChange,
        handleEditSaved,
        retry,
    } = useApplicationsData({ onDataChange });

    return (
        <>
        <div className="space-y-4">
            <ApplicationsToolbar
                search={search}
                onSearchChange={handleSearchChange}
                statusFilter={statusFilter}
                onStatusFilterChange={handleStatusFilterChange}
                sortDir={sortDir}
                onSortToggle={handleSortToggle}
            />

            {loading && (
                <div className="flex items-center justify-center py-16">
                    <Spinner size="lg" />
                </div>
            )}

            {!loading && error && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
                    <p className="text-sm text-[var(--muted-foreground)] mb-3">{error}</p>
                    <button
                        onClick={retry}
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
                    <div className="hidden md:block rounded-xl md:rounded-b-none border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-sm animate-[fade-in_0.3s_ease-out]">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-[var(--border)]">
                                <thead className="bg-[var(--muted)]/60">
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
                                                    applicationId={app.id}
                                                    hasCredentials={app.username !== null || app.password !== null}
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

                    <ApplicationsFooter
                        pageSize={pageSize}
                        onPageSizeChange={handlePageSizeChange}
                        page={data.page.number}
                        totalPages={data.page.totalPages}
                        totalElements={data.page.totalElements}
                        currentPageSize={data.page.size}
                        onPageChange={handlePageChange}
                    />
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
