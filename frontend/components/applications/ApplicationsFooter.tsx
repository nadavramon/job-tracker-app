'use client';

import Pagination from '@/components/ui/Pagination';

interface ApplicationsFooterProps {
    pageSize: number;
    onPageSizeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    page: number;
    totalPages: number;
    totalElements: number;
    currentPageSize: number;
    onPageChange: (page: number) => void;
}

export default function ApplicationsFooter({
    pageSize,
    onPageSizeChange,
    page,
    totalPages,
    totalElements,
    currentPageSize,
    onPageChange,
}: ApplicationsFooterProps) {
    return (
        <div className="mt-3 rounded-xl border border-(--border) bg-(--card) px-4 py-3 md:mt-0 md:rounded-none md:rounded-b-xl md:border-t-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-(--muted-foreground)">
                    <label htmlFor="page-size-select">Rows per page:</label>
                    <select
                        id="page-size-select"
                        value={pageSize}
                        onChange={onPageSizeChange}
                        aria-label="Rows per page"
                        className={[
                            'rounded-md border border-(--border) bg-(--background)',
                            'text-(--foreground) text-sm px-2 py-1 outline-none',
                            'focus:border-(--primary)',
                        ].join(' ')}
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>

                {totalPages > 1 && (
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        totalElements={totalElements}
                        pageSize={currentPageSize}
                        onPageChange={onPageChange}
                    />
                )}
            </div>
        </div>
    );
}
