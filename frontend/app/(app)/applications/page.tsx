'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { useMounted } from '@/lib/useMounted';
import ApplicationsTable from '@/components/applications/ApplicationsTable';
import Spinner from '@/components/ui/Spinner';

export default function ApplicationsPage() {
    const router = useRouter();
    const mounted = useMounted();

    useEffect(() => {
        if (mounted && !isAuthenticated()) {
            router.push('/login');
        }
    }, [mounted, router]);

    if (!mounted) {
        return (
            <div className="flex items-center justify-center py-16">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!isAuthenticated()) return null;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Applications</h1>
            <ApplicationsTable />
        </div>
    );
}
