'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { createApplication } from '@/lib/applicationService';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/errorMessages';
import ApplicationForm, { ApplicationFormValues } from '@/components/applications/ApplicationForm';
import JobExtractor from '@/components/applications/JobExtractor';
import { ExtractJobPostingOutput } from '@/lib/ai/types';
import { Application } from '@/types';

export default function NewApplicationPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [extractionKey, setExtractionKey] = useState(0);
    const [prefill, setPrefill] = useState<Application | undefined>(undefined);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
        }
    }, [router]);

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

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 animate-[fade-in_0.3s_ease-out]">
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">New Application</h1>
            <JobExtractor onExtracted={handleExtracted} />
            <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
                <ApplicationForm
                    key={extractionKey}
                    defaultValues={prefill}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    submitLabel="Create Application"
                    collapsibleCredentials
                />
            </div>
        </div>
    );
}
