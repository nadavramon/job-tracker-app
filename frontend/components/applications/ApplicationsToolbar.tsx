'use client';

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

            <select
                value={statusFilter}
                onChange={onStatusFilterChange}
                aria-label="Filter by status"
                className={selectCls}
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23737373' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.6rem center',
                    backgroundSize: '1rem',
                    paddingRight: '2.25rem',
                }}
            >
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                ))}
            </select>

            <button
                onClick={onSortToggle}
                aria-label={`Sort by applied date ${sortDir === 'desc' ? 'ascending' : 'descending'}`}
                className={[
                    'inline-flex items-center gap-1.5 rounded-md border border-[var(--border)]',
                    'bg-[var(--background)] text-[var(--foreground)] text-sm px-3 py-2',
                    'hover:bg-[var(--muted)] transition-colors whitespace-nowrap',
                ].join(' ')}
            >
                Applied Date {sortDir === 'desc' ? '↓' : '↑'}
            </button>
        </div>
    );
}
