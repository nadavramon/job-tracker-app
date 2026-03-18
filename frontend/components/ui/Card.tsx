'use client';

interface CardProps {
    title: string;
    value: string | number;
    icon?: React.ReactNode;
    subtitle?: string;
    children?: React.ReactNode;
    className?: string;
}

export default function Card({ title, value, icon, subtitle, children, className = '' }: CardProps) {
    return (
        <div
            className={[
                'rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm',
                'hover:shadow-md hover:-translate-y-0.5 transition-all',
                'flex items-start gap-4',
                className,
            ].join(' ')}
        >
            {icon && (
                <div className="shrink-0 rounded-lg bg-[var(--primary)]/10 p-2.5 text-[var(--primary)]">
                    {icon}
                </div>
            )}
            <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                    {title}
                </p>
                <p className="mt-1 text-3xl font-bold text-[var(--card-foreground)] leading-none">
                    {value}
                </p>
                {subtitle && (
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">{subtitle}</p>
                )}
                {children}
            </div>
        </div>
    );
}
