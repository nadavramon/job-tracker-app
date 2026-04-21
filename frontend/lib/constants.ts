import { JobType, Status } from '@/types';

export const STATUS_OPTIONS: { value: Status; label: string }[] = [
    { value: 'APPLIED',      label: 'Applied' },
    { value: 'SCREENING',    label: 'Screening' },
    { value: 'INTERVIEWING', label: 'Interviewing' },
    { value: 'OFFER',        label: 'Offer' },
    { value: 'REJECTED',     label: 'Rejected' },
    { value: 'WITHDRAWN',    label: 'Withdrawn' },
];

export const STATUS_LABELS: Record<Status, string> =
    Object.fromEntries(STATUS_OPTIONS.map(o => [o.value, o.label])) as Record<Status, string>;

export const JOB_TYPE_OPTIONS: { value: JobType; label: string }[] = [
    { value: 'FULL_TIME',   label: 'Full-time' },
    { value: 'PART_TIME',   label: 'Part-time' },
    { value: 'CONTRACT',    label: 'Contract' },
    { value: 'INTERNSHIP',  label: 'Internship' },
];

export const JOB_TYPE_LABELS: Record<JobType, string> =
    Object.fromEntries(JOB_TYPE_OPTIONS.map(o => [o.value, o.label])) as Record<JobType, string>;
