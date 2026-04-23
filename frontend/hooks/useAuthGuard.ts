'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { useMounted } from '@/hooks/useMounted';

/**
 * Redirects to /login if the user is not authenticated.
 * Returns true when the page is safe to render (mounted + authenticated).
 */
export default function useAuthGuard(): boolean {
    const router = useRouter();
    const mounted = useMounted();

    useEffect(() => {
        if (mounted && !isAuthenticated()) {
            router.push('/login');
        }
    }, [mounted, router]);

    return mounted && isAuthenticated();
}
