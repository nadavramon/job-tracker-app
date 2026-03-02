'use client';

import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import ApiInterceptorSetup from '@/components/layout/ApiInterceptorSetup';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <ToastProvider>
                <ApiInterceptorSetup />
                {children}
            </ToastProvider>
        </ThemeProvider>
    );
}
