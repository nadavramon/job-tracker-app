'use client';

import { useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import { injectToast } from '@/lib/api';

/**
 * Null-rendering component that wires the ToastContext into the Axios
 * response interceptor. Must be rendered inside ToastProvider.
 */
export default function ApiInterceptorSetup() {
    const { toast } = useToast();

    useEffect(() => {
        injectToast((type, message) => {
            if (type === 'error') toast.error(message);
            else toast.warning(message);
        });
        return () => { injectToast(null); };
    }, [toast]);

    return null;
}
