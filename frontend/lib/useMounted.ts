'use client';

import { useEffect, useState } from 'react';

/** Returns `false` during SSR and the first render, `true` after hydration. */
export function useMounted(): boolean {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    return mounted;
}
