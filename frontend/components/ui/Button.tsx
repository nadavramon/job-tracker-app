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
        'bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
    secondary:
        'bg-[var(--muted)] text-[var(--foreground)] hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
    destructive:
        'bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--destructive)]',
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
                'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-opacity outline-none',
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
