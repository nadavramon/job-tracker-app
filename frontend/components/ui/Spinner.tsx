'use client';

export type SpinnerSize = 'sm' | 'md' | 'lg';

interface SpinnerProps {
    size?: SpinnerSize;
    className?: string;
}

const SIZE_CLASSES: Record<SpinnerSize, string> = {
    sm: 'h-3.5 w-3.5 border-2',
    md: 'h-5 w-5 border-2',
    lg: 'h-7 w-7 border-[3px]',
};

export default function Spinner({ size = 'md', className = '' }: SpinnerProps) {
    return (
        <span
            role="status"
            aria-label="Loading"
            className={[
                'inline-block rounded-full border-current border-t-transparent animate-spin',
                SIZE_CLASSES[size],
                className,
            ].join(' ')}
        />
    );
}
