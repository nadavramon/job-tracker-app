'use client';

import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import ApiInterceptorSetup from '@/components/layout/ApiInterceptorSetup';
import OfflineBanner from '@/components/layout/OfflineBanner';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <ToastProvider>
                <ApiInterceptorSetup />
                <OfflineBanner />
                {children}
            </ToastProvider>
        </ThemeProvider>
    );
}
