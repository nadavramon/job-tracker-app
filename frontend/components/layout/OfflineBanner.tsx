'use client';

import { useSyncExternalStore } from 'react';
import { WifiOff } from 'lucide-react';

function subscribe(callback: () => void) {
    window.addEventListener('online', callback);
    window.addEventListener('offline', callback);
    return () => {
        window.removeEventListener('online', callback);
        window.removeEventListener('offline', callback);
    };
}

function getSnapshot() {
    return !navigator.onLine;
}

function getServerSnapshot() {
    return false; // assume online during SSR
}

interface OfflineBannerProps {
    onRetry?: () => void;
}

export default function OfflineBanner({ onRetry = () => window.location.reload() }: OfflineBannerProps) {
    const isOffline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    if (!isOffline) return null;

    return (
        <div
            role="alert"
            className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between gap-3 bg-(--warning) px-4 py-2 text-sm font-medium text-(--warning-foreground) animate-[fade-in_0.3s_ease-out]"
        >
            <div className="flex items-center gap-2">
                <WifiOff className="h-4 w-4 shrink-0" />
                <span>You appear to be offline. Changes will not be saved.</span>
            </div>
            <button
                onClick={onRetry}
                className="rounded border border-white/50 px-3 py-1 text-xs transition-colors hover:bg-white/20"
            >
                Retry
            </button>
        </div>
    );
}
