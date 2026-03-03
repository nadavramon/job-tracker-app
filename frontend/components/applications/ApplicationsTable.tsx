'use client';

import { useCallback, useEffect, useState } from 'react';
import { getApplications } from '@/lib/applicationService';
import { Application, JobType, PagedResponse } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import Spinner from '@/components/ui/Spinner';

const PAGE_SIZE = 20;

const JOB_TYPE_LABELS: Record<JobType, string> = {
    FULL_TIME: 'Full-time',
    PART_TIME: 'Part-time',
    CONTRACT: 'Contract',
    INTERNSHIP: 'Internship',
};

const thCls =
    'px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]';
const tdCls = 'px-4 py-3 text-sm text-[var(--foreground)] whitespace-nowrap';

export default function ApplicationsTable() {
    const [page, setPage] = useState(0);
    const [data, setData] = useState<PagedResponse<Application> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchPage = useCallback(async (p: number) => {
        setLoading(true);
        setError('');
        try {
            const result = await getApplications(p, PAGE_SIZE, 'appliedDate,desc');
            setData(result);
        } catch {
            setError('Failed to load applications. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPage(page);
    }, [page, fetchPage]);

    const handlePageChange = useCallback((p: number) => {
        setPage(p);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
                <p className="text-sm text-[var(--muted-foreground)] mb-3">{error}</p>
                <button
                    onClick={() => fetchPage(page)}
                    className="text-sm font-medium text-[var(--primary)] hover:underline"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!data || data.totalElements === 0) {
        return (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
                <p className="text-[var(--muted-foreground)]">No applications yet.</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
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
                                <td className={`${tdCls} font-medium`}>{app.companyName}</td>
                                <td className={tdCls}>{app.jobRole}</td>
                                <td className={tdCls}>
                                    <StatusBadge status={app.status} />
                                </td>
                                <td className={tdCls}>{app.appliedDate}</td>
                                <td className={`${tdCls} text-[var(--muted-foreground)]`}>
                                    {app.location}
                                </td>
                                <td className={`${tdCls} text-[var(--muted-foreground)]`}>
                                    {JOB_TYPE_LABELS[app.jobType]}
                                </td>
                                <td className={`${tdCls} font-mono text-[var(--muted-foreground)]`}>
                                    {app.username || app.password ? '••••••••' : '—'}
                                </td>
                                <td className={tdCls}>—</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {data.totalPages > 1 && (
                <div className="px-4 py-3 border-t border-[var(--border)]">
                    <Pagination
                        page={data.number}
                        totalPages={data.totalPages}
                        totalElements={data.totalElements}
                        pageSize={data.size}
                        onPageChange={handlePageChange}
                    />
                </div>
            )}
        </div>
    );
}
