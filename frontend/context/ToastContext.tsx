'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import Toast, { ToastItem, ToastType } from '@/components/ui/Toast';

interface ToastContextValue {
    toast: {
        success: (message: string) => void;
        error: (message: string) => void;
        info: (message: string) => void;
        warning: (message: string) => void;
    };
}

const DISMISS_MS: Record<ToastType, number> = {
    success: 3000,
    info: 3000,
    error: 6000,
    warning: 6000,
};

const MAX_TOASTS = 5;

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const [mounted, setMounted] = useState(false);
    const counterRef = useRef(0);

    useEffect(() => { setMounted(true); }, []);

    const dismiss = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((type: ToastType, message: string) => {
        const id = `toast-${++counterRef.current}`;
        setToasts(prev => {
            const next = [{ id, type, message }, ...prev];
            return next.slice(0, MAX_TOASTS);
        });
        setTimeout(() => dismiss(id), DISMISS_MS[type]);
    }, [dismiss]);

    const toast = useMemo(() => ({
        success: (msg: string) => addToast('success', msg),
        error: (msg: string) => addToast('error', msg),
        info: (msg: string) => addToast('info', msg),
        warning: (msg: string) => addToast('warning', msg),
    }), [addToast]);

    const toastStack = (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-50 pointer-events-none w-full max-w-sm px-4">
            {toasts.map(t => (
                <Toast key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
            ))}
        </div>
    );

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            {mounted && ReactDOM.createPortal(toastStack, document.body)}
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within a ToastProvider');
    return ctx;
}
