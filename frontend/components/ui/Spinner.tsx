'use client';

import { Loader2 } from 'lucide-react';

export type SpinnerSize = 'sm' | 'md' | 'lg';

interface SpinnerProps {
    size?: SpinnerSize;
    className?: string;
}

const SIZE_PX: Record<SpinnerSize, number> = {
    sm: 14,
    md: 20,
    lg: 28,
};

export default function Spinner({ size = 'md', className = '' }: SpinnerProps) {
    return (
        <span
            role="status"
            aria-label="Loading"
            className={`inline-flex ${className}`}
        >
            <Loader2 className="animate-spin" size={SIZE_PX[size]} />
        </span>
    );
}
