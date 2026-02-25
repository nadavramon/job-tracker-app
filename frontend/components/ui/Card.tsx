'use client';

interface CardProps {
    title: string;
    value: string | number;
    icon?: React.ReactNode;
    subtitle?: string;
    className?: string;
}

export default function Card({ title, value, icon, subtitle, className = '' }: CardProps) {
    return (
        <div
            className={[
                'rounded-xl border border-[var(--border)] bg-[var(--card)] p-5',
                'flex items-start gap-4',
                className,
            ].join(' ')}
        >
            {icon && (
                <div className="shrink-0 rounded-lg bg-[var(--muted)] p-2.5 text-[var(--muted-foreground)]">
                    {icon}
                </div>
            )}
            <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                    {title}
                </p>
                <p className="mt-1 text-2xl font-bold text-[var(--card-foreground)] leading-none">
                    {value}
                </p>
                {subtitle && (
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">{subtitle}</p>
                )}
            </div>
        </div>
    );
}
