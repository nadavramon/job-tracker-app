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

interface UseChartColorsOptions {
    dashboard?: boolean;
}

export default function useChartColors(options?: UseChartColorsOptions): ChartColors {
    const { resolvedTheme } = useTheme();
    const dashboard = options?.dashboard ?? false;

    return useMemo(() => {
        // resolvedTheme is used as a cache key — when the theme changes,
        // CSS variable values change and we need to re-resolve them.
        void resolvedTheme;

        const status = {} as Record<Status, string>;
        for (const [key, cssVar] of Object.entries(STATUS_VAR_MAP)) {
            status[key as Status] = resolve(cssVar);
        }

        if (dashboard) {
            return {
                status,
                axis: resolve('--dash-chart-axis'),
                grid: resolve('--dash-chart-grid'),
                tooltipBg: resolve('--dash-card'),
                tooltipBorder: resolve('--dash-card-border'),
                tooltipText: resolve('--dash-heading'),
                cursor: resolve('--dash-table-row-hover'),
                primary: resolve('--dash-primary'),
                legendText: resolve('--dash-subtext'),
            };
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
    }, [resolvedTheme, dashboard]);
}
