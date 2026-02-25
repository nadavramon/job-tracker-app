'use client';

import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
    );
}
