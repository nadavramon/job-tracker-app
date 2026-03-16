'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { updateApplication } from '@/lib/applicationService';
import { Status } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { useToast } from '@/context/ToastContext';

const STATUS_OPTIONS: { value: Status; label: string }[] = [
    { value: 'APPLIED',      label: 'Applied' },
    { value: 'SCREENING',    label: 'Screening' },
    { value: 'INTERVIEWING', label: 'Interviewing' },
    { value: 'OFFER',        label: 'Offer' },
    { value: 'REJECTED',     label: 'Rejected' },
    { value: 'WITHDRAWN',    label: 'Withdrawn' },
];

interface StatusSelectProps {
    applicationId: string;
    status: Status;
    onStatusChange: (id: string, newStatus: Status) => void;
}

export default function StatusSelect({ applicationId, status, onStatusChange }: StatusSelectProps) {
    const [editState, setEditState] = useState<'idle' | 'editing' | 'saving'>('idle');
    const [currentStatus, setCurrentStatus] = useState<Status>(status);
    const [pendingStatus, setPendingStatus] = useState<Status>(status);
    const skipSaveRef = useRef(false);
    const { toast } = useToast();

    useEffect(() => {
        setCurrentStatus(status);
    }, [status]);

    const save = useCallback(async (newStatus: Status) => {
        if (newStatus === currentStatus) {
            setEditState('idle');
            return;
        }
        setEditState('saving');
        try {
            await updateApplication(applicationId, { status: newStatus });
            setCurrentStatus(newStatus);
            onStatusChange(applicationId, newStatus);
            toast.success('Status updated');
        } catch {
            toast.error('Failed to update status');
        } finally {
            setEditState('idle');
        }
    }, [applicationId, currentStatus, onStatusChange, toast]);

    const handleBadgeClick = useCallback(() => {
        setPendingStatus(currentStatus);
        setEditState('editing');
    }, [currentStatus]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLSelectElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur(); // triggers handleBlur → save
        } else if (e.key === 'Escape') {
            skipSaveRef.current = true;
            e.currentTarget.blur(); // triggers handleBlur, flag prevents save
        }
    }, []);

    const handleBlur = useCallback(() => {
        if (skipSaveRef.current) {
            skipSaveRef.current = false;
            setEditState('idle');
            return;
        }
        save(pendingStatus);
    }, [pendingStatus, save]);

    if (editState === 'saving') {
        return (
            <span className="inline-flex items-center px-2.5 py-0.5">
                <Spinner size="sm" />
            </span>
        );
    }

    if (editState === 'editing') {
        return (
            <select
                autoFocus
                value={pendingStatus}
                onChange={(e) => setPendingStatus(e.target.value as Status)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                aria-label="Change status"
                className={[
                    'rounded-md border border-[var(--border)] bg-[var(--background)]',
                    'text-[var(--foreground)] text-xs px-2 py-1 outline-none',
                    'focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]/30',
                ].join(' ')}
            >
                {STATUS_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                ))}
            </select>
        );
    }

    return (
        <button
            onClick={handleBadgeClick}
            aria-label={`Status: ${currentStatus}. Click to edit`}
            className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
            <StatusBadge status={currentStatus} />
        </button>
    );
}
