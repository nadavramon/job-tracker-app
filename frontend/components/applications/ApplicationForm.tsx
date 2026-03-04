'use client';

import { useCallback, useState } from 'react';
import { Application, JobType, Status } from '@/types';
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
}

const STATUS_OPTIONS = [
    { value: 'APPLIED',      label: 'Applied' },
    { value: 'SCREENING',    label: 'Screening' },
    { value: 'INTERVIEWING', label: 'Interviewing' },
    { value: 'OFFER',        label: 'Offer' },
    { value: 'REJECTED',     label: 'Rejected' },
    { value: 'WITHDRAWN',    label: 'Withdrawn' },
];

const JOB_TYPE_OPTIONS = [
    { value: 'FULL_TIME',   label: 'Full-time' },
    { value: 'PART_TIME',   label: 'Part-time' },
    { value: 'CONTRACT',    label: 'Contract' },
    { value: 'INTERNSHIP',  label: 'Internship' },
];

function initialValues(app?: Application): ApplicationFormValues {
    return {
        companyName:  app?.companyName  ?? '',
        jobRole:      app?.jobRole      ?? '',
        location:     app?.location     ?? '',
        appliedDate:  app?.appliedDate  ?? '',
        status:       app?.status       ?? 'APPLIED',
        jobType:      app?.jobType      ?? 'FULL_TIME',
        websiteLink:  app?.websiteLink  ?? '',
        username:     app?.username     ?? '',
        password:     app?.password     ?? '',
    };
}

type Errors = Partial<Record<keyof ApplicationFormValues, string>>;

function validate(values: ApplicationFormValues): Errors {
    const errors: Errors = {};
    if (!values.companyName.trim()) errors.companyName = 'Company name is required';
    if (!values.jobRole.trim())     errors.jobRole     = 'Job role is required';
    if (!values.location.trim())    errors.location    = 'Location is required';
    if (!values.appliedDate)        errors.appliedDate = 'Applied date is required';
    return errors;
}

export default function ApplicationForm({ defaultValues, onSubmit, onCancel, submitLabel = 'Save' }: Props) {
    const [values, setValues] = useState<ApplicationFormValues>(() => initialValues(defaultValues));
    const [errors, setErrors] = useState<Errors>({});
    const [submitting, setSubmitting] = useState(false);

    const set = useCallback(<K extends keyof ApplicationFormValues>(key: K, val: ApplicationFormValues[K]) => {
        setValues(prev => ({ ...prev, [key]: val }));
        setErrors(prev => ({ ...prev, [key]: undefined }));
    }, []);

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
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                    label="Company Name"
                    value={values.companyName}
                    onChange={e => set('companyName', e.target.value)}
                    error={errors.companyName}
                    placeholder="e.g. Acme Corp"
                />
                <Input
                    label="Job Role"
                    value={values.jobRole}
                    onChange={e => set('jobRole', e.target.value)}
                    error={errors.jobRole}
                    placeholder="e.g. Software Engineer"
                />
                <Input
                    label="Location"
                    value={values.location}
                    onChange={e => set('location', e.target.value)}
                    error={errors.location}
                    placeholder="e.g. Remote, Tel Aviv"
                />
                <DatePicker
                    label="Applied Date"
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
                <Input
                    label="Website Link"
                    type="url"
                    value={values.websiteLink}
                    onChange={e => set('websiteLink', e.target.value)}
                    placeholder="https://..."
                />
                <Input
                    label="Portal Username"
                    value={values.username}
                    onChange={e => set('username', e.target.value)}
                    placeholder="Optional"
                />
            </div>

            <Input
                label="Portal Password"
                type="password"
                value={values.password}
                onChange={e => set('password', e.target.value)}
                placeholder="Optional"
            />

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
