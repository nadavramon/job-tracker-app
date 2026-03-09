'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import ApplicationsTable from '@/components/applications/ApplicationsTable';

export default function ApplicationsPage() {
    const router = useRouter();
    const authenticated = isAuthenticated();

    useEffect(() => {
        if (!authenticated) {
            router.push('/login');
        }
    }, [authenticated, router]);

    if (!authenticated) return null;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Applications</h1>
            <ApplicationsTable />
        </div>
    );
}
