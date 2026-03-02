'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';

export default function SettingsPage() {
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
        }
    }, [router]);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-gray-500 mt-2">Coming soon.</p>
        </div>
    );
}
