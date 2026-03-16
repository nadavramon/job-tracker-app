'use client';

import { useCallback, useState } from 'react';
import { getCredentials } from '@/lib/applicationService';
import { CredentialsResponse } from '@/types';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/errorMessages';
import Spinner from '@/components/ui/Spinner';

interface Props {
    applicationId: string;
    hasCredentials: boolean;
}

function EyeIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    );
}

function EyeOffIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
        </svg>
    );
}

export default function CredentialCell({ applicationId, hasCredentials }: Props) {
    const [credentials, setCredentials] = useState<CredentialsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(false);
    const { toast } = useToast();

    const handleToggle = useCallback(async () => {
        if (visible) {
            setVisible(false);
            setCredentials(null);
            return;
        }
        setLoading(true);
        try {
            const data = await getCredentials(applicationId);
            setCredentials(data);
            setVisible(true);
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    }, [visible, credentials, applicationId, toast]);

    if (!hasCredentials) {
        return <span className="text-[var(--muted-foreground)]">—</span>;
    }

    return (
        <div className="flex items-center gap-2">
            {visible && credentials ? (
                <div className="font-mono text-xs space-y-0.5">
                    {credentials.username !== null && (
                        <div>
                            <span className="text-[var(--muted-foreground)]">user: </span>
                            <span>{credentials.username}</span>
                        </div>
                    )}
                    {credentials.password !== null && (
                        <div>
                            <span className="text-[var(--muted-foreground)]">pass: </span>
                            <span>{credentials.password}</span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="font-mono text-xs space-y-0.5">
                    <div>
                        <span className="text-[var(--muted-foreground)]">user: </span>
                        <span>••••••••</span>
                    </div>
                    <div>
                        <span className="text-[var(--muted-foreground)]">pass: </span>
                        <span>••••••••</span>
                    </div>
                </div>
            )}

            <button
                onClick={handleToggle}
                disabled={loading}
                aria-label={visible ? 'Hide credentials' : 'Show credentials'}
                className="shrink-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors disabled:opacity-50"
            >
                {loading ? <Spinner size="sm" /> : visible ? <EyeOffIcon /> : <EyeIcon />}
            </button>
        </div>
    );
}
