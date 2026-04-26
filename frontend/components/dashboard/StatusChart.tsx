'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
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
    const colors = useChartColors({ dashboard: true });

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

    const total = useMemo(
        () => chartData.reduce((sum, d) => sum + d.value, 0),
        [chartData],
    );

    if (chartData.length === 0) {
        return (
            <div className="rounded-2xl border border-(--dash-card-border) bg-(--dash-card) p-6 flex items-center justify-center h-64">
                <p className="text-sm text-(--dash-subtext)">No applications yet</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-(--dash-card-border) bg-(--dash-card) p-6">
            <h3 className="text-lg font-bold text-(--dash-heading)">Status Breakdown</h3>
            <p className="mt-0.5 text-xs text-(--dash-subtext) mb-4">Current application statuses</p>
            <ResponsiveContainer width="100%" height={200}>
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
                    {/* Center label */}
                    <text
                        x="50%"
                        y="47%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-(--dash-heading)"
                        style={{ fontSize: 24, fontWeight: 700 }}
                    >
                        {total}
                    </text>
                    <text
                        x="50%"
                        y="58%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-(--dash-subtext)"
                        style={{ fontSize: 11 }}
                    >
                        Active
                    </text>
                </PieChart>
            </ResponsiveContainer>
            {/* Custom legend */}
            <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
                {chartData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                        <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-xs text-(--dash-subtext)">{entry.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
