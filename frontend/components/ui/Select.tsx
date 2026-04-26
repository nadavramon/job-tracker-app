'use client';

import { SelectHTMLAttributes, useId } from 'react';
import { ChevronDown } from 'lucide-react';

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
    const generatedId = useId();
    const selectId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : generatedId);
    const errorId = `${selectId}-error`;

    return (
        <div className="flex flex-col gap-1">
            {label && (
                <label
                    htmlFor={selectId}
                    className="text-sm font-medium text-(--foreground)"
                >
                    {label}
                </label>
            )}
            <div className="relative">
                <select
                    id={selectId}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : undefined}
                    className={[
                        'w-full rounded-md border px-3 py-2 pr-9 text-sm outline-none transition-colors appearance-none shadow-sm',
                        'bg-(--background) text-(--foreground)',
                        'border-(--border)',
                        'focus:border-(--primary) focus:ring-2 focus:ring-(--ring)/50',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        error ? 'border-(--destructive)' : '',
                        className,
                    ].join(' ')}
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
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-(--muted-foreground) pointer-events-none" />
            </div>
            {error && (
                <p id={errorId} className="text-xs text-(--destructive)">{error}</p>
            )}
        </div>
    );
}
