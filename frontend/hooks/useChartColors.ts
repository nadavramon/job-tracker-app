'use client';

import { useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Status } from '@/types';

const STATUS_VAR_MAP: Record<Status, string> = {
    APPLIED:      '--status-applied',
    SCREENING:    '--status-screening',
    INTERVIEWING: '--status-interviewing',
    OFFER:        '--status-offer',
    REJECTED:     '--status-rejected',
    WITHDRAWN:    '--status-withdrawn',
};

function resolve(varName: string): string {
    if (typeof window === 'undefined') return '';
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

interface ChartColors {
    status: Record<Status, string>;
    axis: string;
    grid: string;
    tooltipBg: string;
    tooltipBorder: string;
    tooltipText: string;
    cursor: string;
    primary: string;
    legendText: string;
}

export default function useChartColors(): ChartColors {
    const { resolvedTheme } = useTheme();

    return useMemo(() => {
        // resolvedTheme is used as a cache key — when the theme changes,
        // CSS variable values change and we need to re-resolve them.
        void resolvedTheme;

        const status = {} as Record<Status, string>;
        for (const [key, cssVar] of Object.entries(STATUS_VAR_MAP)) {
            status[key as Status] = resolve(cssVar);
        }

        return {
            status,
            axis: resolve('--muted-foreground'),
            grid: resolve('--border'),
            tooltipBg: resolve('--card'),
            tooltipBorder: resolve('--border'),
            tooltipText: resolve('--card-foreground'),
            cursor: resolve('--muted'),
            primary: resolve('--primary'),
            legendText: resolve('--muted-foreground'),
        };
    }, [resolvedTheme]);
}
