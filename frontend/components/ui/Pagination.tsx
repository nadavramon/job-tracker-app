'use client';

interface PaginationProps {
    page: number;          // 0-based (matches Spring Pageable)
    totalPages: number;
    totalElements: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}

function getPageNumbers(current: number, total: number): (number | '…')[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);
    if (current <= 3) return [0, 1, 2, 3, 4, '…', total - 1];
    if (current >= total - 4) return [0, '…', total - 5, total - 4, total - 3, total - 2, total - 1];
    return [0, '…', current - 1, current, current + 1, '…', total - 1];
}

export default function Pagination({
    page,
    totalPages,
    totalElements,
    pageSize,
    onPageChange,
}: PaginationProps) {
    if (totalPages <= 1) return null;

    const from = page * pageSize + 1;
    const to = Math.min((page + 1) * pageSize, totalElements);
    const pages = getPageNumbers(page, totalPages);

    const btnBase =
        'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-8 min-w-[2rem] px-2 disabled:opacity-40 disabled:cursor-not-allowed';
    const btnDefault =
        'border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)]';
    const btnActive =
        'bg-[var(--primary)] text-[var(--primary-foreground)] border border-[var(--primary)]';

    return (
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-sm text-[var(--muted-foreground)]">
                Showing <span className="font-medium text-[var(--foreground)]">{from}–{to}</span> of{' '}
                <span className="font-medium text-[var(--foreground)]">{totalElements}</span>
            </p>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 0}
                    aria-label="Previous page"
                    className={`${btnBase} ${btnDefault}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>

                {pages.map((p, i) =>
                    p === '…' ? (
                        <span key={`ellipsis-${i}`} className="px-1 text-[var(--muted-foreground)]">…</span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            aria-label={`Page ${p + 1}`}
                            aria-current={p === page ? 'page' : undefined}
                            className={`${btnBase} ${p === page ? btnActive : btnDefault}`}
                        >
                            {p + 1}
                        </button>
                    )
                )}

                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages - 1}
                    aria-label="Next page"
                    className={`${btnBase} ${btnDefault}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
