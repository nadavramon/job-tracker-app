'use client';

import { useCallback, useState } from 'react';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { getCredentials } from '@/lib/applicationService';
import { CredentialsResponse } from '@/types';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/errorMessages';
import Spinner from '@/components/ui/Spinner';

interface Props {
    applicationId: string;
    hasCredentials: boolean;
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
    }, [visible, applicationId, toast]);

    if (!hasCredentials) {
        return <span className="text-(--muted-foreground)" aria-label="No credentials">—</span>;
    }

    return (
        <div className="flex items-center gap-2">
            <KeyRound className="h-3.5 w-3.5 shrink-0 text-(--muted-foreground)" aria-hidden="true" />
            {visible && credentials ? (
                <div className="font-mono text-xs space-y-0.5">
                    {credentials.username !== null && (
                        <div>
                            <span className="text-(--muted-foreground)">user: </span>
                            <span>{credentials.username}</span>
                        </div>
                    )}
                    {credentials.password !== null && (
                        <div>
                            <span className="text-(--muted-foreground)">pass: </span>
                            <span>{credentials.password}</span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="font-mono text-xs space-y-0.5">
                    <div>
                        <span className="text-(--muted-foreground)">user: </span>
                        <span>••••••••</span>
                    </div>
                    <div>
                        <span className="text-(--muted-foreground)">pass: </span>
                        <span>••••••••</span>
                    </div>
                </div>
            )}

            <button
                onClick={handleToggle}
                disabled={loading}
                aria-label={visible ? 'Hide credentials' : 'Show credentials'}
                className="shrink-0 text-(--muted-foreground) hover:text-(--foreground) transition-colors disabled:opacity-50"
            >
                {loading ? <Spinner size="sm" /> : visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
        </div>
    );
}
