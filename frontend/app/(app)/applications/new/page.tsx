'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createApplication } from '@/lib/applicationService';
import useAuthGuard from '@/hooks/useAuthGuard';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/errorMessages';
import ApplicationForm, { ApplicationFormValues } from '@/components/applications/ApplicationForm';
import JobExtractor from '@/components/applications/JobExtractor';
import { ExtractJobPostingOutput } from '@/lib/ai/types';
import { Application } from '@/types';

export default function NewApplicationPage() {
    const router = useRouter();
    const { toast } = useToast();
    const ready = useAuthGuard();
    const [extractionKey, setExtractionKey] = useState(0);
    const [prefill, setPrefill] = useState<Application | undefined>(undefined);
    const [extracting, setExtracting] = useState(false);

    const handleExtracted = useCallback((data: ExtractJobPostingOutput) => {
        setPrefill({
            id: '',
            companyName: data.companyName ?? '',
            jobRole: data.jobRole ?? '',
            location: data.location ?? '',
            jobType: data.jobType ?? 'FULL_TIME',
            appliedDate: '',
            status: 'APPLIED',
            statusChangedDate: null,
            websiteLink: data.websiteLink ?? null,
            username: null,
            password: null,
        });
        setExtractionKey((k) => k + 1);
        toast.success('Job details extracted');
    }, [toast]);

    const handleSubmit = useCallback(async (values: ApplicationFormValues) => {
        try {
            await createApplication({
                companyName: values.companyName,
                jobRole: values.jobRole,
                location: values.location,
                appliedDate: values.appliedDate,
                status: values.status,
                jobType: values.jobType,
                statusChangedDate: null,
                websiteLink: values.websiteLink || null,
                username: values.username || null,
                password: values.password || null,
            });
            toast.success('Application created');
            router.push('/dashboard');
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    }, [router, toast]);

    const handleCancel = useCallback(() => {
        router.push('/dashboard');
    }, [router]);

    if (!ready) return null;

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 animate-[fade-in_0.3s_ease-out]">
            <h1 className="text-2xl font-bold text-foreground mb-6">New Application</h1>
            <JobExtractor onExtracted={handleExtracted} onLoadingChange={setExtracting} />
            <div className="mt-6 rounded-xl border border-(--border) bg-(--card) p-6 shadow-sm">
                <ApplicationForm
                    key={extractionKey}
                    defaultValues={prefill}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    submitLabel="Create Application"
                    collapsibleCredentials
                    extracting={extracting}
                />
            </div>
        </div>
    );
}
