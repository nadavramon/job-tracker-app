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
    const colors = useChartColors();

    const chartData = useMemo(
        () => data.map((d) => ({ ...d, month: formatMonth(d.month) })),
        [data],
    );

    if (data.length === 0) {
        return (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 flex items-center justify-center h-64">
                <p className="text-sm text-[var(--muted-foreground)]">No monthly data yet</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)] mb-4">
                Applications by Month
            </p>
            <ResponsiveContainer width="100%" height={220}>
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
                    <Bar dataKey="count" fill={colors.primary} radius={[4, 4, 0, 0]} name="Applications" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
