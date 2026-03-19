'use client';

import { ArrowDown, ArrowUp, ChevronDown } from 'lucide-react';
import { Status } from '@/types';
import SearchInput from '@/components/ui/SearchInput';

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

interface ApplicationsToolbarProps {
    search: string;
    onSearchChange: (value: string) => void;
    statusFilter: Status | '';
    onStatusFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    sortDir: 'asc' | 'desc';
    onSortToggle: () => void;
}

export default function ApplicationsToolbar({
    search,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    sortDir,
    onSortToggle,
}: ApplicationsToolbarProps) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <SearchInput
                value={search}
                onChange={onSearchChange}
                placeholder="Search companies…"
                className="flex-1 min-w-[180px]"
            />

            <div className="relative">
                <select
                    value={statusFilter}
                    onChange={onStatusFilterChange}
                    aria-label="Filter by status"
                    className={`${selectCls} pr-9`}
                >
                    <option value="">All Statuses</option>
                    {STATUS_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>
                <ChevronDown
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]"
                    aria-hidden="true"
                />
            </div>

            <button
                onClick={onSortToggle}
                aria-label={`Sort by applied date ${sortDir === 'desc' ? 'ascending' : 'descending'}`}
                className={[
                    'inline-flex items-center gap-1.5 rounded-md border border-[var(--border)]',
                    'bg-[var(--background)] text-[var(--foreground)] text-sm px-3 py-2',
                    'hover:bg-[var(--muted)] transition-colors whitespace-nowrap',
                ].join(' ')}
            >
                Applied Date
                {sortDir === 'desc'
                    ? <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                    : <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                }
            </button>
        </div>
    );
}
