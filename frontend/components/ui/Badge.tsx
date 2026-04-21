'use client';

import { Status } from '@/types';
import { STATUS_LABELS } from '@/lib/constants';

// Generic variant badge
export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
    default:  'bg-[var(--status-applied)]/15 text-[var(--status-applied)] border border-[var(--status-applied)]/25',
    success:  'bg-[var(--status-offer)]/15 text-[var(--status-offer)] border border-[var(--status-offer)]/25',
    warning:  'bg-[var(--status-interviewing)]/15 text-[var(--status-interviewing)] border border-[var(--status-interviewing)]/25',
    danger:   'bg-[var(--status-rejected)]/15 text-[var(--status-rejected)] border border-[var(--status-rejected)]/25',
    info:     'bg-[var(--status-screening)]/15 text-[var(--status-screening)] border border-[var(--status-screening)]/25',
    muted:    'bg-[var(--muted)] text-[var(--muted-foreground)] border border-[var(--border)]',
};

// Map application statuses to badge variants
const STATUS_VARIANT: Record<Status, BadgeVariant> = {
    APPLIED:      'default',
    SCREENING:    'info',
    INTERVIEWING: 'warning',
    OFFER:        'success',
    REJECTED:     'danger',
    WITHDRAWN:    'muted',
};

interface BadgeProps {
    variant?: BadgeVariant;
    children: React.ReactNode;
    className?: string;
}

export default function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
    return (
        <span
            className={[
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                VARIANT_CLASSES[variant],
                className,
            ].join(' ')}
        >
            {children}
        </span>
    );
}

/** Convenience wrapper that maps a Status enum value to the correct Badge variant and label. */
export function StatusBadge({ status, className }: { status: Status; className?: string }) {
    return (
        <Badge variant={STATUS_VARIANT[status]} className={className}>
            {STATUS_LABELS[status]}
        </Badge>
    );
}
