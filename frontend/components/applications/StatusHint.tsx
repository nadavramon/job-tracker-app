'use client';

import { Status } from '@/types';

interface Props {
    status: Status;
    appliedDate: string; // 'YYYY-MM-DD'
}

function daysSince(dateStr: string): number {
    const applied = new Date(dateStr);
    applied.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.floor((today.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24));
}

export default function StatusHint({ status, appliedDate }: Props) {
    if (status !== 'APPLIED') return null;

    const days = daysSince(appliedDate);

    if (days >= 30) {
        return (
            <span
                className="inline-block h-2.5 w-2.5 rounded-full shrink-0 bg-[var(--status-rejected)] animate-pulse"
                title={`Applied ${days} days ago — may be ghosted`}
                aria-label={`Applied ${days} days ago — may be ghosted`}
                role="img"
            />
        );
    }

    if (days >= 14) {
        return (
            <span
                className="inline-block h-2.5 w-2.5 rounded-full shrink-0 bg-[var(--warning)] animate-pulse"
                title={`Applied ${days} days ago — consider following up`}
                aria-label={`Applied ${days} days ago — consider following up`}
                role="img"
            />
        );
    }

    return (
        <span
            className="inline-block h-2.5 w-2.5 rounded-full shrink-0 bg-[var(--success)]"
            title={`Applied ${days} days ago — recently submitted`}
            aria-label={`Applied ${days} days ago — recently submitted`}
            role="img"
        />
    );
}
