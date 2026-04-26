'use client';

import { Status } from '@/types';
import { STATUS_LABELS } from '@/lib/constants';

// Generic variant badge
export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
    default:  'bg-(--status-applied)/15 text-(--status-applied) border border-(--status-applied)/25',
    success:  'bg-(--status-offer)/15 text-(--status-offer) border border-(--status-offer)/25',
    warning:  'bg-(--status-interviewing)/15 text-(--status-interviewing) border border-(--status-interviewing)/25',
    danger:   'bg-(--status-rejected)/15 text-(--status-rejected) border border-(--status-rejected)/25',
    info:     'bg-(--status-screening)/15 text-(--status-screening) border border-(--status-screening)/25',
    muted:    'bg-(--muted) text-(--muted-foreground) border border-(--border)',
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
