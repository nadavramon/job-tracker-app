'use client';

import { useCallback } from 'react';
import { updateApplication } from '@/lib/applicationService';
import { Application } from '@/types';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/errorMessages';
import Modal from '@/components/ui/Modal';
import ApplicationForm, { ApplicationFormValues } from '@/components/applications/ApplicationForm';

interface Props {
    application: Application | null;
    onClose: () => void;
    onSaved: (updated: Application) => void;
}

export default function EditModal({ application, onClose, onSaved }: Props) {
    const { toast } = useToast();

    const handleSubmit = useCallback(async (values: ApplicationFormValues) => {
        if (!application) return;
        try {
            const updated = await updateApplication(application.id, {
                companyName:  values.companyName,
                jobRole:      values.jobRole,
                location:     values.location,
                appliedDate:  values.appliedDate,
                status:       values.status,
                jobType:      values.jobType,
                websiteLink:  values.websiteLink  || null,
                username:     values.username     || null,
                password:     values.password     || null,
            });
            toast.success('Application updated');
            onSaved(updated);
            onClose();
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    }, [application, toast, onSaved, onClose]);

    return (
        <Modal
            open={application !== null}
            onClose={onClose}
            title="Edit application"
            maxWidth="max-w-2xl"
        >
            {application && (
                <ApplicationForm
                    defaultValues={application}
                    onSubmit={handleSubmit}
                    onCancel={onClose}
                    submitLabel="Save changes"
                />
            )}
        </Modal>
    );
}
