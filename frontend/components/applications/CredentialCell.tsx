'use client';

import { useCallback, useState } from 'react';

interface Props {
    username: string | null;
    password: string | null;
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

export default function CredentialCell({ username, password }: Props) {
    const [visible, setVisible] = useState(false);

    const toggle = useCallback(() => setVisible(prev => !prev), []);

    if (username === null && password === null) {
        return <span className="text-[var(--muted-foreground)]">—</span>;
    }

    return (
        <div className="flex items-center gap-2">
            <div className="font-mono text-xs space-y-0.5">
                {username !== null && (
                    <div>
                        <span className="text-[var(--muted-foreground)]">user: </span>
                        <span>{visible ? username : '••••••••'}</span>
                    </div>
                )}
                {password !== null && (
                    <div>
                        <span className="text-[var(--muted-foreground)]">pass: </span>
                        <span>{visible ? password : '••••••••'}</span>
                    </div>
                )}
            </div>

            <button
                onClick={toggle}
                aria-label={visible ? 'Hide credentials' : 'Show credentials'}
                className="shrink-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
                {visible ? <EyeOffIcon /> : <EyeIcon />}
            </button>
        </div>
    );
}
