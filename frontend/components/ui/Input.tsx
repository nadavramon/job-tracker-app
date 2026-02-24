'use client';

import { InputHTMLAttributes, useState } from 'react';

type InputType = 'text' | 'email' | 'password' | 'url';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    type?: InputType;
    label?: string;
    error?: string;
}

const EyeIcon = ({ open }: { open: boolean }) =>
    open ? (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
    );

export default function Input({
    type = 'text',
    label,
    error,
    id,
    className = '',
    ...props
}: InputProps) {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    const resolvedType = type === 'password' ? (showPassword ? 'text' : 'password') : type;

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
            <div className="relative">
                <input
                    id={inputId}
                    type={resolvedType}
                    className={[
                        'w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors',
                        'bg-[var(--background)] text-[var(--foreground)]',
                        'border-[var(--border)] placeholder:text-[var(--muted-foreground)]',
                        'focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]/30',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        error ? 'border-[var(--destructive)]' : '',
                        type === 'password' ? 'pr-9' : '',
                        className,
                    ].join(' ')}
                    {...props}
                />
                {type === 'password' && (
                    <button
                        type="button"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                    >
                        <EyeIcon open={showPassword} />
                    </button>
                )}
            </div>
            {error && (
                <p className="text-xs text-[var(--destructive)]">{error}</p>
            )}
        </div>
    );
}
