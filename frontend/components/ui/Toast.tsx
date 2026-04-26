'use client';

import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastProps {
    toast: ToastItem;
    onDismiss: () => void;
}

const TYPE_CLASSES: Record<ToastType, string> = {
    success: 'bg-(--success) text-(--success-foreground)',
    error: 'bg-(--destructive) text-(--destructive-foreground)',
    info: 'bg-(--info) text-(--info-foreground)',
    warning: 'bg-(--warning) text-(--warning-foreground)',
};

const TYPE_ICONS: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle className="h-4 w-4" />,
    error: <XCircle className="h-4 w-4" />,
    info: <Info className="h-4 w-4" />,
    warning: <AlertTriangle className="h-4 w-4" />,
};

export default function Toast({ toast, onDismiss }: ToastProps) {
    return (
        <div
            role="alert"
            className={`flex items-start gap-3 rounded-lg px-4 py-3 shadow-lg pointer-events-auto animate-[toast-enter_0.2s_ease-out] ${TYPE_CLASSES[toast.type]}`}
        >
            <span className="mt-0.5 shrink-0">{TYPE_ICONS[toast.type]}</span>
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
                onClick={onDismiss}
                aria-label="Close"
                className="shrink-0 ml-1 opacity-80 hover:opacity-100 transition-opacity"
            >
                <X className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}
