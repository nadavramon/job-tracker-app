'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '@/context/ThemeContext';
import { Status } from '@/types';

const STATUS_COLORS: Record<Status, string> = {
    APPLIED:      '#3b82f6',
    SCREENING:    '#a855f7',
    INTERVIEWING: '#f59e0b',
    OFFER:        '#22c55e',
    REJECTED:     '#ef4444',
    WITHDRAWN:    '#6b7280',
};

const STATUS_LABELS: Record<Status, string> = {
    APPLIED:      'Applied',
    SCREENING:    'Screening',
    INTERVIEWING: 'Interviewing',
    OFFER:        'Offer',
    REJECTED:     'Rejected',
    WITHDRAWN:    'Withdrawn',
};

const STATUS_ORDER: Status[] = ['APPLIED', 'SCREENING', 'INTERVIEWING', 'OFFER', 'REJECTED', 'WITHDRAWN'];

interface StatusChartProps {
    statusBreakdown: Partial<Record<Status, number>>;
}

export default function StatusChart({ statusBreakdown }: StatusChartProps) {
    const { resolvedTheme } = useTheme();

    const tooltipColors = useMemo(() => (
        resolvedTheme === 'dark'
            ? { bg: '#1a1a1a', border: '#2e2e2e', text: '#ededed' }
            : { bg: '#ffffff', border: '#e5e5e5', text: '#171717' }
    ), [resolvedTheme]);

    const legendColor = resolvedTheme === 'dark' ? '#a3a3a3' : '#737373';

    const chartData = useMemo(
        () => STATUS_ORDER
            .filter((s) => (statusBreakdown[s] ?? 0) > 0)
            .map((s) => ({
                name: STATUS_LABELS[s],
                value: statusBreakdown[s]!,
                color: STATUS_COLORS[s],
            })),
        [statusBreakdown],
    );

    if (chartData.length === 0) {
        return (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 flex items-center justify-center h-64">
                <p className="text-sm text-[var(--muted-foreground)]">No applications yet</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)] mb-4">
                Status Breakdown
            </p>
            <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={2}
                        dataKey="value"
                    >
                        {chartData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} stroke="none" />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: tooltipColors.bg,
                            border: `1px solid ${tooltipColors.border}`,
                            borderRadius: '8px',
                            color: tooltipColors.text,
                            fontSize: 12,
                        }}
                    />
                    <Legend
                        iconType="circle"
                        iconSize={8}
                        formatter={(value) => (
                            <span style={{ fontSize: 12, color: legendColor }}>{value}</span>
                        )}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
