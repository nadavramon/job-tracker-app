'use client';

import { useState, useCallback } from 'react';
import { Sparkles, Check, Trash2 } from 'lucide-react';
import { updateProfile } from '@/lib/userService';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/errorMessages';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface Props {
    hasApiKey: boolean;
    onUpdated: (hasApiKey: boolean) => void;
}

export default function ApiKeySection({ hasApiKey, onUpdated }: Props) {
    const { toast } = useToast();
    const [apiKey, setApiKey] = useState('');
    const [saving, setSaving] = useState(false);
    const [removing, setRemoving] = useState(false);

    const handleSave = useCallback(async () => {
        if (!apiKey.trim()) return;

        setSaving(true);
        try {
            await updateProfile({ anthropicApiKey: apiKey.trim() });
            setApiKey('');
            onUpdated(true);
            toast.success('API key saved');
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setSaving(false);
        }
    }, [apiKey, onUpdated, toast]);

    const handleRemove = useCallback(async () => {
        setRemoving(true);
        try {
            await updateProfile({ anthropicApiKey: '' });
            onUpdated(false);
            toast.success('API key removed');
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setRemoving(false);
        }
    }, [onUpdated, toast]);

    const handleKeyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setApiKey(e.target.value);
    }, []);

    return (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
            <div>
                <h2 id="ai-heading" className="text-base font-semibold text-[var(--foreground)] flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[var(--primary)]" />
                    AI Configuration
                </h2>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                    Add your Anthropic API key to enable Smart Fill.
                </p>
            </div>

            <div className="flex items-center gap-2 text-sm">
                <span className="text-[var(--muted-foreground)]">Status:</span>
                {hasApiKey ? (
                    <span className="inline-flex items-center gap-1 text-[var(--success)]">
                        <Check className="h-3.5 w-3.5" />
                        Configured
                    </span>
                ) : (
                    <span className="text-[var(--muted-foreground)]">Not configured</span>
                )}
            </div>

            <Input
                label={hasApiKey ? 'Replace API key' : 'API key'}
                type="password"
                value={apiKey}
                onChange={handleKeyChange}
                placeholder="sk-ant-..."
            />

            <div className="flex items-center justify-between pt-2">
                <div>
                    {hasApiKey && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleRemove}
                            loading={removing}
                        >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                            Remove key
                        </Button>
                    )}
                </div>
                <Button
                    onClick={handleSave}
                    disabled={!apiKey.trim()}
                    loading={saving}
                >
                    Save key
                </Button>
            </div>

            <p className="text-xs text-[var(--muted-foreground)]">
                Your key is encrypted at rest and never displayed after saving.
                Get a key from the Anthropic Console.
            </p>
        </div>
    );
}
