'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import useChartColors from '@/hooks/useChartColors';
import { Status } from '@/types';

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
    const colors = useChartColors();

    const chartData = useMemo(
        () => STATUS_ORDER
            .filter((s) => (statusBreakdown[s] ?? 0) > 0)
            .map((s) => ({
                name: STATUS_LABELS[s],
                value: statusBreakdown[s]!,
                color: colors.status[s],
            })),
        [statusBreakdown, colors.status],
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
                            backgroundColor: colors.tooltipBg,
                            border: `1px solid ${colors.tooltipBorder}`,
                            borderRadius: '8px',
                            color: colors.tooltipText,
                            fontSize: 12,
                        }}
                    />
                    <Legend
                        iconType="circle"
                        iconSize={8}
                        formatter={(value) => (
                            <span style={{ fontSize: 12, color: colors.legendText }}>{value}</span>
                        )}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
