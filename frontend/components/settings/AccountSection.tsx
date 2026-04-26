'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { deleteAccount } from '@/lib/userService';
import { removeUsername } from '@/lib/auth';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/errorMessages';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface AccountSectionProps {
    username: string;
}

export default function AccountSection({ username }: AccountSectionProps) {
    const router = useRouter();
    const { toast } = useToast();

    const [showModal, setShowModal] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [deleting, setDeleting] = useState(false);

    const openModal = useCallback(() => {
        setConfirmText('');
        setShowModal(true);
    }, []);

    const closeModal = useCallback(() => {
        if (!deleting) setShowModal(false);
    }, [deleting]);

    const handleConfirmChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setConfirmText(e.target.value);
    }, []);

    const handleDelete = useCallback(async () => {
        setDeleting(true);
        try {
            await deleteAccount();
            removeUsername();
            toast.success('Account deleted');
            setDeleting(false);
            router.push('/login');
        } catch (error) {
            toast.error(getErrorMessage(error));
            setDeleting(false);
        }
    }, [router, toast]);

    const canConfirm = confirmText === username;

    return (
        <div className="rounded-xl border border-(--destructive)/30 bg-(--card) p-6 space-y-4">
            <div>
                <h2 id="account-heading" className="text-base font-semibold text-(--destructive) flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                    Delete Account
                </h2>
                <p className="text-sm text-(--muted-foreground) mt-1">
                    Permanently delete your account and all associated data. This action cannot be undone.
                </p>
            </div>

            <Button variant="destructive" onClick={openModal}>
                Delete Account
            </Button>

            <Modal open={showModal} onClose={closeModal} title="Delete Account" maxWidth="max-w-sm">
                <div className="space-y-4">
                    <p className="text-sm text-(--muted-foreground)">
                        This action is permanent. Type your username to confirm.
                    </p>

                    <Input
                        label={`Type "${username}" to confirm`}
                        value={confirmText}
                        onChange={handleConfirmChange}
                        placeholder={username}
                        disabled={deleting}
                    />

                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" size="sm" onClick={closeModal} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                            disabled={!canConfirm || deleting}
                            loading={deleting}
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
