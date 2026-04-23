'use client';

import { useCallback, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Application, JobType, Status } from '@/types';
import { STATUS_OPTIONS, JOB_TYPE_OPTIONS } from '@/lib/constants';
import Button from '@/components/ui/Button';
import DatePicker from '@/components/ui/DatePicker';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

export interface ApplicationFormValues {
    companyName: string;
    jobRole: string;
    location: string;
    appliedDate: string;
    status: Status;
    jobType: JobType;
    websiteLink: string;
    username: string;
    password: string;
}

interface Props {
    defaultValues?: Application;
    onSubmit: (values: ApplicationFormValues) => Promise<void>;
    onCancel: () => void;
    submitLabel?: string;
    collapsibleCredentials?: boolean;
    extracting?: boolean;
}

function todayIso(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function initialValues(app?: Application): ApplicationFormValues {
    return {
        companyName:  app?.companyName  ?? '',
        jobRole:      app?.jobRole      ?? '',
        location:     app?.location     ?? '',
        appliedDate:  app?.appliedDate  ?? todayIso(),
        status:       app?.status       ?? 'APPLIED',
        jobType:      app?.jobType      ?? 'FULL_TIME',
        websiteLink:  app?.websiteLink  ?? '',
        username:     app?.username     ?? '',
        password:     '',
    };
}

type Errors = Partial<Record<keyof ApplicationFormValues, string>>;

function validate(values: ApplicationFormValues): Errors {
    const errors: Errors = {};
    if (!values.companyName.trim()) errors.companyName = 'Company name is required';
    if (!values.jobRole.trim())     errors.jobRole     = 'Job role is required';
    if (!values.location.trim())    errors.location    = 'Location is required';
    if (!values.appliedDate)        errors.appliedDate = 'Applied date is required';
    if (values.websiteLink && !values.websiteLink.startsWith('http://') && !values.websiteLink.startsWith('https://')) {
        errors.websiteLink = 'Website link must start with http:// or https://';
    }
    return errors;
}

export default function ApplicationForm({ defaultValues, onSubmit, onCancel, submitLabel = 'Save', collapsibleCredentials = false, extracting = false }: Props) {
    const [values, setValues] = useState<ApplicationFormValues>(() => initialValues(defaultValues));
    const [errors, setErrors] = useState<Errors>({});
    const [submitting, setSubmitting] = useState(false);
    const [credentialsOpen, setCredentialsOpen] = useState(false);

    const set = useCallback(<K extends keyof ApplicationFormValues>(key: K, val: ApplicationFormValues[K]) => {
        setValues(prev => ({ ...prev, [key]: val }));
        setErrors(prev => ({ ...prev, [key]: undefined }));
    }, []);

    const toggleCredentials = useCallback(() => setCredentialsOpen(o => !o), []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        const errs = validate(values);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }
        setSubmitting(true);
        try {
            await onSubmit(values);
        } finally {
            setSubmitting(false);
        }
    }, [values, onSubmit]);

    return (
        <form onSubmit={handleSubmit} noValidate className="relative space-y-4">
            {extracting && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-[var(--card)]/80 backdrop-blur-[1px]">
                    <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
                        Extracting job details...
                    </div>
                </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                    label="Company Name"
                    required
                    value={values.companyName}
                    onChange={e => set('companyName', e.target.value)}
                    error={errors.companyName}
                    placeholder="e.g. Acme Corp"
                />
                <Input
                    label="Job Role"
                    required
                    value={values.jobRole}
                    onChange={e => set('jobRole', e.target.value)}
                    error={errors.jobRole}
                    placeholder="e.g. Software Engineer"
                />
                <Input
                    label="Location"
                    required
                    value={values.location}
                    onChange={e => set('location', e.target.value)}
                    error={errors.location}
                    placeholder="e.g. Remote, Tel Aviv"
                />
                <DatePicker
                    label="Applied Date"
                    required
                    value={values.appliedDate}
                    onChange={e => set('appliedDate', e.target.value)}
                    error={errors.appliedDate}
                />
                <Select
                    label="Status"
                    value={values.status}
                    options={STATUS_OPTIONS}
                    onChange={e => set('status', e.target.value as Status)}
                />
                <Select
                    label="Job Type"
                    value={values.jobType}
                    options={JOB_TYPE_OPTIONS}
                    onChange={e => set('jobType', e.target.value as JobType)}
                />
                <div className={collapsibleCredentials ? 'sm:col-span-2' : ''}>
                    <Input
                        label="Website Link"
                        type="url"
                        value={values.websiteLink}
                        onChange={e => set('websiteLink', e.target.value)}
                        error={errors.websiteLink}
                        placeholder="https://..."
                    />
                </div>
                {!collapsibleCredentials && (
                    <Input
                        label="Portal Username"
                        value={values.username}
                        onChange={e => set('username', e.target.value)}
                        placeholder="Optional"
                    />
                )}
            </div>

            {!collapsibleCredentials && (
                <Input
                    label="Portal Password"
                    type="password"
                    value={values.password}
                    onChange={e => set('password', e.target.value)}
                    placeholder="Leave blank to keep existing"
                />
            )}

            {collapsibleCredentials && (
                <div className="rounded-lg border border-[var(--border)] overflow-hidden">
                    <button
                        type="button"
                        onClick={toggleCredentials}
                        aria-expanded={credentialsOpen}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                    >
                        <span>Portal Credentials</span>
                        <ChevronDown
                            className={`h-4 w-4 transition-transform duration-200 ${credentialsOpen ? 'rotate-180' : ''}`}
                            aria-hidden="true"
                        />
                    </button>
                    {credentialsOpen && (
                        <div className="border-t border-[var(--border)] px-4 py-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Input
                                label="Portal Username"
                                value={values.username}
                                onChange={e => set('username', e.target.value)}
                                placeholder="Optional"
                            />
                            <Input
                                label="Portal Password"
                                type="password"
                                value={values.password}
                                onChange={e => set('password', e.target.value)}
                                placeholder="Optional"
                            />
                        </div>
                    )}
                </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
                    Cancel
                </Button>
                <Button type="submit" loading={submitting}>
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}
