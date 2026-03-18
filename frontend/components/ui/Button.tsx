'use client';

import { ButtonHTMLAttributes } from 'react';
import Spinner from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
    primary:
        'bg-[var(--primary)] text-[var(--primary-foreground)] hover:brightness-110 shadow-sm hover:shadow-md focus-visible:ring-2 focus-visible:ring-[var(--ring)]/50',
    secondary:
        'bg-[var(--muted)] text-[var(--foreground)] hover:brightness-95 dark:hover:brightness-125 shadow-sm hover:shadow-md focus-visible:ring-2 focus-visible:ring-[var(--ring)]/50',
    destructive:
        'bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:brightness-110 shadow-sm hover:shadow-md focus-visible:ring-2 focus-visible:ring-[var(--destructive)]/50',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
};

export default function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    className = '',
    children,
    ...props
}: ButtonProps) {
    const isDisabled = disabled || loading;

    return (
        <button
            disabled={isDisabled}
            className={[
                'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all outline-none active:scale-[0.98]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                VARIANT_CLASSES[variant],
                SIZE_CLASSES[size],
                className,
            ].join(' ')}
            {...props}
        >
            {loading && <Spinner size="sm" />}
            {children}
        </button>
    );
}
