'use client';

import { useState, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/errorMessages';
import { ExtractJobPostingOutput } from '@/lib/ai/types';
import { extractJobPosting } from '@/lib/aiService';

interface Props {
    onExtracted: (data: ExtractJobPostingOutput) => void;
}

export default function JobExtractor({ onExtracted }: Props) {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleExtract = useCallback(async () => {
        if (!text.trim()) return;

        setLoading(true);

        try {
            const data = await extractJobPosting(text.trim());
            onExtracted(data);
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    }, [text, onExtracted, toast]);

    return (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[var(--primary)]" />
                <h3 className="text-sm font-medium text-[var(--foreground)]">
                    Smart Fill
                </h3>
            </div>
            <p className="mb-3 text-xs text-[var(--muted-foreground)]">
                Paste a job posting URL or text to auto-fill the form.
            </p>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste a job posting URL or description..."
                rows={3}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/50"
            />
            <div className="mt-3 flex justify-end">
                <Button
                    size="sm"
                    onClick={handleExtract}
                    disabled={!text.trim()}
                    loading={loading}
                >
                    Extract Details
                </Button>
            </div>
        </div>
    );
}
