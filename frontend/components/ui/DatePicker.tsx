'use client';

import { InputHTMLAttributes } from 'react';

interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
    error?: string;
}

export default function DatePicker({
    label,
    error,
    id,
    className = '',
    ...props
}: DatePickerProps) {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="flex flex-col gap-1">
            {label && (
                <label
                    htmlFor={inputId}
                    className="text-sm font-medium text-[var(--foreground)]"
                >
                    {label}
                </label>
            )}
            <input
                id={inputId}
                type="date"
                className={[
                    'w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors',
                    'bg-[var(--background)] text-[var(--foreground)]',
                    'border-[var(--border)]',
                    'focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]/30',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    '[color-scheme:light] dark:[color-scheme:dark]',
                    error ? 'border-[var(--destructive)]' : '',
                    className,
                ].join(' ')}
                {...props}
            />
            {error && (
                <p className="text-xs text-[var(--destructive)]">{error}</p>
            )}
        </div>
    );
}
