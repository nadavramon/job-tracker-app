'use client';

import { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer,
} from 'recharts';
import useChartColors from '@/hooks/useChartColors';
import { MonthlyCount } from '@/types';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatMonth(month: string): string {
    const [year, m] = month.split('-');
    return `${MONTH_LABELS[parseInt(m, 10) - 1]} '${year.slice(2)}`;
}

interface ApplicationsChartProps {
    data: MonthlyCount[];
}

export default function ApplicationsChart({ data }: ApplicationsChartProps) {
    const colors = useChartColors({ dashboard: true });

    const chartData = useMemo(
        () => data.map((d) => ({ ...d, month: formatMonth(d.month) })),
        [data],
    );

    if (data.length === 0) {
        return (
            <div className="rounded-2xl border border-[var(--dash-card-border)] bg-[var(--dash-card)] p-6 flex items-center justify-center h-64">
                <p className="text-sm text-[var(--dash-subtext)]">No monthly data yet</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-[var(--dash-card-border)] bg-[var(--dash-card)] p-6">
            <h3 className="text-lg font-bold text-[var(--dash-heading)]">Applications by Month</h3>
            <p className="mt-0.5 text-xs text-[var(--dash-subtext)] mb-4">Monthly application activity</p>
            <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                    <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: colors.axis }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: colors.axis }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: colors.tooltipBg,
                            border: `1px solid ${colors.tooltipBorder}`,
                            borderRadius: '8px',
                            color: colors.tooltipText,
                            fontSize: 12,
                        }}
                        cursor={{ fill: colors.cursor }}
                    />
                    <Bar dataKey="count" fill={colors.primary} radius={[6, 6, 0, 0]} name="Applications" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
