'use client';

import { SelectHTMLAttributes } from 'react';

export interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
    label?: string;
    options: SelectOption[];
    placeholder?: string;
    error?: string;
}

export default function Select({
    label,
    options,
    placeholder,
    error,
    id,
    className = '',
    ...props
}: SelectProps) {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="flex flex-col gap-1">
            {label && (
                <label
                    htmlFor={selectId}
                    className="text-sm font-medium text-[var(--foreground)]"
                >
                    {label}
                </label>
            )}
            <select
                id={selectId}
                className={[
                    'w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors appearance-none',
                    'bg-[var(--background)] text-[var(--foreground)]',
                    'border-[var(--border)]',
                    'focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]/30',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    error ? 'border-[var(--destructive)]' : '',
                    className,
                ].join(' ')}
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23737373' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.6rem center',
                    backgroundSize: '1rem',
                    paddingRight: '2.25rem',
                }}
                {...props}
            >
                {placeholder && (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                )}
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && (
                <p className="text-xs text-[var(--destructive)]">{error}</p>
            )}
        </div>
    );
}
