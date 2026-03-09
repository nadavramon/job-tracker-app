'use client';

import { StatsResponse, Status } from '@/types';
import Card from '@/components/ui/Card';

interface StatusConfig {
    label: string;
    bg: string;
    text: string;
}

const STATUS_CONFIG: Record<Status, StatusConfig> = {
    APPLIED:      { label: 'Applied',      bg: 'bg-blue-100   dark:bg-blue-900/40',    text: 'text-blue-800   dark:text-blue-300'   },
    SCREENING:    { label: 'Screening',    bg: 'bg-purple-100 dark:bg-purple-900/40',  text: 'text-purple-800 dark:text-purple-300' },
    INTERVIEWING: { label: 'Interviewing', bg: 'bg-amber-100  dark:bg-amber-900/40',   text: 'text-amber-800  dark:text-amber-300'  },
    OFFER:        { label: 'Offer',        bg: 'bg-green-100  dark:bg-green-900/40',   text: 'text-green-800  dark:text-green-300'  },
    REJECTED:     { label: 'Rejected',     bg: 'bg-red-100    dark:bg-red-900/40',     text: 'text-red-800    dark:text-red-300'    },
    WITHDRAWN:    { label: 'Withdrawn',    bg: 'bg-[var(--muted)]',                    text: 'text-[var(--muted-foreground)]'       },
};

const STATUS_ORDER: Status[] = ['APPLIED', 'SCREENING', 'INTERVIEWING', 'OFFER', 'REJECTED', 'WITHDRAWN'];

interface StatsBarProps {
    stats: StatsResponse;
}

export default function StatsBar({ stats }: StatsBarProps) {
    const responseRatePct = Math.round(stats.responseRate * 100);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Total Applications */}
            <Card title="Total Applications" value={stats.totalApplications} />

            {/* Status Breakdown */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)] mb-3">
                    Status Breakdown
                </p>
                <div className="grid grid-cols-3 gap-2">
                    {STATUS_ORDER.map((status) => {
                        const { label, bg, text } = STATUS_CONFIG[status];
                        const count = stats.statusBreakdown[status] ?? 0;
                        return (
                            <div key={status} className={`rounded-lg p-2 ${bg}`}>
                                <p className={`text-lg font-bold leading-none ${text}`}>{count}</p>
                                <p className={`mt-0.5 text-xs ${text}`}>{label}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Response Rate */}
            <Card title="Response Rate" value={`${responseRatePct}%`}>
                <div
                    role="progressbar"
                    aria-valuenow={responseRatePct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Response rate progress"
                    className="mt-3 h-2 rounded-full bg-[var(--muted)] overflow-hidden"
                >
                    <div
                        className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
                        style={{ width: `${responseRatePct}%` }}
                    />
                </div>
                <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">
                    of applications received a response
                </p>
            </Card>
        </div>
    );
}
