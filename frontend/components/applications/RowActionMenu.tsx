'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MoreVertical, Pencil, ExternalLink, Trash2 } from 'lucide-react';

interface Props {
    websiteLink: string | null;
    onEdit: () => void;
    onDelete: () => void;
}

export default function RowActionMenu({ websiteLink, onEdit, onDelete }: Props) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const close = useCallback(() => setOpen(false), []);

    const toggle = useCallback(() => setOpen(prev => !prev), []);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        function onMouseDown(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', onMouseDown);
        return () => document.removeEventListener('mousedown', onMouseDown);
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false);
        }
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open]);

    const handleEdit = useCallback(() => {
        close();
        onEdit();
    }, [close, onEdit]);

    const handleDelete = useCallback(() => {
        close();
        onDelete();
    }, [close, onDelete]);

    const isSafeUrl = !!websiteLink && (
        websiteLink.startsWith('http://') || websiteLink.startsWith('https://')
    );

    const handleOpenWebsite = useCallback(() => {
        if (!isSafeUrl) return;
        close();
        window.open(websiteLink!, '_blank', 'noopener,noreferrer');
    }, [close, isSafeUrl, websiteLink]);

    return (
        <div ref={containerRef} className="relative inline-block">
            <button
                onClick={toggle}
                aria-label="Row actions"
                aria-expanded={open}
                aria-haspopup="menu"
                className="rounded p-1 text-(--muted-foreground) hover:text-(--foreground) hover:bg-(--muted) transition-colors"
            >
                <MoreVertical className="h-4 w-4" aria-hidden="true" />
            </button>

            {open && (
                <div
                    role="menu"
                    className={[
                        'absolute right-0 z-20 mt-1 w-40 rounded-md border border-(--border)',
                        'bg-(--card) shadow-md',
                    ].join(' ')}
                >
                    <button
                        role="menuitem"
                        onClick={handleEdit}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-(--foreground) hover:bg-(--muted) transition-colors"
                    >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        Edit
                    </button>

                    <button
                        role="menuitem"
                        onClick={handleOpenWebsite}
                        disabled={!isSafeUrl}
                        className={[
                            'w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                            isSafeUrl
                                ? 'text-(--foreground) hover:bg-(--muted)'
                                : 'text-(--muted-foreground) cursor-not-allowed',
                        ].join(' ')}
                    >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        Open Website
                    </button>

                    <button
                        role="menuitem"
                        onClick={handleDelete}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-red-500 hover:bg-(--muted) transition-colors"
                    >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
}
