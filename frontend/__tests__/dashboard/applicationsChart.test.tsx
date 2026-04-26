import { render, screen } from '@testing-library/react';
import ApplicationsChart, { formatMonth } from '@/components/dashboard/ApplicationsChart';
import { MonthlyCount } from '@/types';

jest.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
}));

jest.mock('@/context/ThemeContext', () => ({
    useTheme: () => ({ resolvedTheme: 'light' }),
}));

const mockData: MonthlyCount[] = [
    { month: '2026-01', count: 5 },
    { month: '2026-02', count: 3 },
    { month: '2026-03', count: 8 },
];

describe('formatMonth', () => {
    it('formats YYYY-MM to "Mon \'YY"', () => {
        expect(formatMonth('2026-01')).toBe("Jan '26");
        expect(formatMonth('2026-12')).toBe("Dec '26");
        expect(formatMonth('2025-07')).toBe("Jul '25");
    });
});

describe('ApplicationsChart', () => {
    it('renders the bar chart when data is provided', () => {
        render(<ApplicationsChart data={mockData} />);
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('renders the chart title', () => {
        render(<ApplicationsChart data={mockData} />);
        expect(screen.getByText(/applications by month/i)).toBeInTheDocument();
    });

    it('shows empty state when data is empty', () => {
        render(<ApplicationsChart data={[]} />);
        expect(screen.getByText(/no monthly data yet/i)).toBeInTheDocument();
        expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
    });

    it('renders correctly in dark theme', () => {
        jest.resetModules();
        jest.mock('@/context/ThemeContext', () => ({
            useTheme: () => ({ resolvedTheme: 'dark' }),
        }));
        render(<ApplicationsChart data={mockData} />);
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
});
