'use client';

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
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-blue-600 text-white',
    warning: 'bg-amber-500 text-white',
};

const TYPE_ICONS: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
};

export default function Toast({ toast, onDismiss }: ToastProps) {
    return (
        <div
            role="alert"
            className={`flex items-start gap-3 rounded-lg px-4 py-3 shadow-lg pointer-events-auto ${TYPE_CLASSES[toast.type]}`}
            style={{ animation: 'toast-enter 0.2s ease-out' }}
        >
            <span className="mt-0.5 shrink-0 text-sm font-bold">{TYPE_ICONS[toast.type]}</span>
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
                onClick={onDismiss}
                aria-label="Close"
                className="shrink-0 ml-1 opacity-80 hover:opacity-100 transition-opacity text-base leading-none"
            >
                ×
            </button>
        </div>
    );
}
