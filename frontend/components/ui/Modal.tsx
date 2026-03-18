'use client';

import { useEffect, useId, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useSyncExternalStore } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    /** Max width class, e.g. 'max-w-md' (default) or 'max-w-lg' */
    maxWidth?: string;
}

function useIsMounted() {
    return useSyncExternalStore(
        () => () => {},
        () => true,
        () => false,
    );
}

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-md' }: ModalProps) {
    const mounted = useIsMounted();
    const panelRef = useRef<HTMLDivElement>(null);
    // useId() generates a stable, unique id per instance — safe when multiple modals exist.
    const titleId = useId();

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open, onClose]);

    // Focus trap: move focus into panel when it opens, restore on close
    useEffect(() => {
        if (!open) return;
        const prev = document.activeElement as HTMLElement | null;
        panelRef.current?.focus();
        return () => { prev?.focus(); };
    }, [open]);

    // Prevent body scroll while open
    useEffect(() => {
        if (!open) return;
        const original = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = original; };
    }, [open]);

    if (!mounted || !open) return null;

    const modal = (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Panel */}
            <div
                ref={panelRef}
                tabIndex={-1}
                className={[
                    'relative w-full rounded-xl shadow-xl outline-none',
                    'bg-[var(--card)] text-[var(--card-foreground)]',
                    'border border-[var(--border)]',
                    'animate-[scale-in_0.2s_ease-out]',
                    maxWidth,
                ].join(' ')}
            >
                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
                        <h2 id={titleId} className="text-base font-semibold">
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            aria-label="Close"
                            className="rounded-md p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* Body */}
                <div className="px-5 py-4">
                    {children}
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modal, document.body);
}
