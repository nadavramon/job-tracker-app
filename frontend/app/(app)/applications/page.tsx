'use client';

import useAuthGuard from '@/hooks/useAuthGuard';
import ApplicationsTable from '@/components/applications/ApplicationsTable';
import Spinner from '@/components/ui/Spinner';

export default function ApplicationsPage() {
    const ready = useAuthGuard();

    if (!ready) {
        return (
            <div className="flex items-center justify-center py-16">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Applications</h1>
            <ApplicationsTable />
        </div>
    );
}
