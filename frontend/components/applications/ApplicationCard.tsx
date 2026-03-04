'use client';

import { Application } from '@/types';
import { JOB_TYPE_LABELS } from '@/lib/constants';
import { StatusBadge } from '@/components/ui/Badge';
import RowActionMenu from '@/components/applications/RowActionMenu';
import StatusHint from '@/components/applications/StatusHint';

interface Props {
    application: Application;
    onEdit: () => void;
    onDelete: () => void;
}

export default function ApplicationCard({ application, onEdit, onDelete }: Props) {
    const { companyName, jobRole, status, appliedDate, location, jobType, websiteLink } = application;

    return (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[var(--foreground)] flex items-center gap-1.5 truncate">
                        <StatusHint status={status} appliedDate={appliedDate} />
                        <span className="truncate">{companyName}</span>
                    </p>
                    <p className="mt-0.5 text-sm text-[var(--muted-foreground)] truncate">{jobRole}</p>
                </div>

                <RowActionMenu
                    websiteLink={websiteLink}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={status} />
                <span className="text-xs text-[var(--muted-foreground)]">{appliedDate}</span>
            </div>

            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
                {location && <span>{location}</span>}
                {jobType && <span>{JOB_TYPE_LABELS[jobType]}</span>}
            </div>
        </div>
    );
}
