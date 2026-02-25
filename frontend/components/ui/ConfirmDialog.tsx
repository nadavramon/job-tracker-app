'use client';

import Modal from './Modal';
import Button from './Button';

interface ConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    loading?: boolean;
}

export default function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Delete',
    cancelLabel = 'Cancel',
    loading = false,
}: ConfirmDialogProps) {
    return (
        <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
            <p className="text-sm text-[var(--muted-foreground)] mb-5">{message}</p>
            <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
                    {cancelLabel}
                </Button>
                <Button variant="destructive" size="sm" onClick={onConfirm} loading={loading}>
                    {confirmLabel}
                </Button>
            </div>
        </Modal>
    );
}
