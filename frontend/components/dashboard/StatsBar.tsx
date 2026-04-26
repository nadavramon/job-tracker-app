'use client';

import { StatsResponse, Status } from '@/types';

interface StatusConfig {
    label: string;
    text: string;
    bg: string;
}

const STATUS_CONFIG: Record<Status, StatusConfig> = {
    APPLIED:      { label: 'Applied',      text: 'text-(--status-applied)',      bg: 'bg-(--status-applied)/15' },
    SCREENING:    { label: 'Screening',    text: 'text-(--status-screening)',    bg: 'bg-(--status-screening)/15' },
    INTERVIEWING: { label: 'Interviewing', text: 'text-(--status-interviewing)', bg: 'bg-(--status-interviewing)/15' },
    OFFER:        { label: 'Offer',        text: 'text-(--status-offer)',        bg: 'bg-(--status-offer)/15' },
    REJECTED:     { label: 'Rejected',     text: 'text-(--status-rejected)',     bg: 'bg-(--status-rejected)/15' },
    WITHDRAWN:    { label: 'Withdrawn',    text: 'text-(--status-withdrawn)',    bg: 'bg-(--status-withdrawn)/15' },
};

const STATUS_ORDER: Status[] = ['APPLIED', 'SCREENING', 'INTERVIEWING', 'OFFER', 'REJECTED', 'WITHDRAWN'];

interface StatsBarProps {
    stats: StatsResponse;
}

export default function StatsBar({ stats }: StatsBarProps) {
    const responseRatePct = Math.round(stats.responseRate);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Total Applications */}
            <div
                className="relative overflow-hidden rounded-2xl border border-(--dash-card-border) bg-(--dash-card) p-6 animate-[fade-in_0.4s_ease-out]"
            >
                <div
                    className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-(--dash-stat-circle)"
                    aria-hidden="true"
                />
                <p className="text-xs font-medium uppercase tracking-wide text-(--dash-subtext)">
                    Total Applications
                </p>
                <p className="mt-2 text-4xl font-bold text-(--dash-primary)">
                    {stats.totalApplications}
                </p>
            </div>

            {/* Status Breakdown */}
            <div
                className="rounded-2xl border border-(--dash-card-border) bg-(--dash-card) p-6 animate-[fade-in_0.4s_ease-out_0.1s_both]"
            >
                <p className="text-xs font-medium uppercase tracking-wide text-(--dash-subtext) mb-3">
                    Status Breakdown
                </p>
                <div className="grid grid-cols-3 gap-2">
                    {STATUS_ORDER.map((status, i) => {
                        const { label, text, bg } = STATUS_CONFIG[status];
                        const count = stats.statusBreakdown[status] ?? 0;
                        return (
                            <div
                                key={status}
                                className={`rounded-lg p-2 animate-[fade-in_0.3s_ease-out_both] ${bg}`}
                                style={{ animationDelay: `${0.15 + i * 0.05}s` }}
                            >
                                <p className={`text-lg font-bold leading-none ${text}`}>
                                    {count}
                                </p>
                                <p className={`mt-0.5 text-xs ${text}`}>
                                    {label}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Response Rate */}
            <div
                className="relative overflow-hidden rounded-2xl border border-(--dash-card-border) bg-(--dash-card) p-6 animate-[fade-in_0.4s_ease-out_0.2s_both]"
            >
                <div
                    className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-(--dash-stat-circle)"
                    aria-hidden="true"
                />
                <p className="text-xs font-medium uppercase tracking-wide text-(--dash-subtext)">
                    Response Rate
                </p>
                <p className="mt-2 text-4xl font-bold text-(--dash-primary)">
                    {responseRatePct}%
                </p>
                <div
                    role="progressbar"
                    aria-valuenow={responseRatePct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Response rate progress"
                    className="mt-3 h-2 rounded-full bg-(--dash-progress-track) overflow-hidden"
                >
                    <div
                        className="h-full rounded-full bg-(--dash-primary) transition-all duration-500"
                        style={{ width: `${responseRatePct}%` }}
                    />
                </div>
                <p className="mt-1.5 text-xs text-(--dash-subtext)">
                    of applications received a response
                </p>
            </div>
        </div>
    );
}
