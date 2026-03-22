'use client';

import { InputHTMLAttributes, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type InputType = 'text' | 'email' | 'password' | 'url';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    type?: InputType;
    label?: string;
    error?: string;
    variant?: 'default' | 'glass';
}

export default function Input({
    type = 'text',
    label,
    error,
    id,
    className = '',
    variant = 'default',
    ...props
}: InputProps) {
    const [showPassword, setShowPassword] = useState(false);
    const generatedId = useId();
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : generatedId);
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
                        'w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors shadow-sm',
                        variant === 'glass'
                            ? 'bg-[var(--auth-glass-bg)] border-[var(--auth-glass-border)] backdrop-blur-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--auth-gradient-to)] focus:ring-2 focus:ring-[var(--auth-gradient-to)]/30'
                            : 'bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]/50',
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
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                )}
            </div>
            {error && (
                <p className="text-xs text-[var(--destructive)]">{error}</p>
            )}
        </div>
    );
}
