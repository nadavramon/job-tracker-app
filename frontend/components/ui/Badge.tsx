'use client';

import { Status } from '@/types';

// Generic variant badge
export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
    default:  'bg-blue-100   text-blue-800   dark:bg-blue-900/40  dark:text-blue-300',
    success:  'bg-green-100  text-green-800  dark:bg-green-900/40 dark:text-green-300',
    warning:  'bg-amber-100  text-amber-800  dark:bg-amber-900/40 dark:text-amber-300',
    danger:   'bg-red-100    text-red-800    dark:bg-red-900/40   dark:text-red-300',
    info:     'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    muted:    'bg-[var(--muted)] text-[var(--muted-foreground)]',
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

const STATUS_LABEL: Record<Status, string> = {
    APPLIED:      'Applied',
    SCREENING:    'Screening',
    INTERVIEWING: 'Interviewing',
    OFFER:        'Offer',
    REJECTED:     'Rejected',
    WITHDRAWN:    'Withdrawn',
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
            {STATUS_LABEL[status]}
        </Badge>
    );
}
