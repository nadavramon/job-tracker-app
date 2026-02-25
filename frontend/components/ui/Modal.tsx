'use client';

import { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useSyncExternalStore } from 'react';

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

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open, onClose]);

    // Focus trap: move focus into panel when it opens
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
            aria-labelledby={title ? 'modal-title' : undefined}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
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
                    maxWidth,
                ].join(' ')}
            >
                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
                        <h2 id="modal-title" className="text-base font-semibold">
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            aria-label="Close"
                            className="rounded-md p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
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
