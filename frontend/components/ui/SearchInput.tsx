'use client';

import { useEffect, useRef, useState } from 'react';

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    debounceMs?: number;
    className?: string;
}

export default function SearchInput({
    value,
    onChange,
    placeholder = 'Search…',
    debounceMs = 300,
    className = '',
}: SearchInputProps) {
    const [local, setLocal] = useState(value);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Keep local in sync if parent resets the value (e.g. on filter clear)
    useEffect(() => { setLocal(value); }, [value]);

    // Clean up pending debounce timer on unmount to prevent setState after unmount.
    useEffect(() => {
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const next = e.target.value;
        setLocal(next);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => onChange(next), debounceMs);
    };

    const handleClear = () => {
        setLocal('');
        if (timerRef.current) clearTimeout(timerRef.current);
        onChange('');
    };

    return (
        <div className={`relative ${className}`}>
            {/* Search icon */}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)] pointer-events-none"
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>

            <input
                type="search"
                value={local}
                onChange={handleChange}
                placeholder={placeholder}
                className={[
                    'w-full rounded-md border px-3 py-2 pl-9 text-sm outline-none transition-colors',
                    'bg-[var(--background)] text-[var(--foreground)]',
                    'border-[var(--border)] placeholder:text-[var(--muted-foreground)]',
                    'focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]/30',
                    local ? 'pr-8' : '',
                ].join(' ')}
            />

            {/* Clear button */}
            {local && (
                <button
                    type="button"
                    onClick={handleClear}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
    );
}
