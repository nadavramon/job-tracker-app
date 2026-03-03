import { render, screen } from '@testing-library/react';
import StatusChart from '@/components/dashboard/StatusChart';

jest.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
    Pie: ({ data }: { data: { name: string }[] }) => (
        <div data-testid="pie" data-slices={data?.length ?? 0} />
    ),
    Cell: () => null,
    Tooltip: () => null,
    Legend: ({ formatter }: { formatter: (v: string) => React.ReactNode }) => (
        <div data-testid="legend">{['Applied', 'Rejected'].map((v) => <span key={v}>{formatter(v)}</span>)}</div>
    ),
}));

jest.mock('@/context/ThemeContext', () => ({
    useTheme: () => ({ resolvedTheme: 'light' }),
}));

describe('StatusChart', () => {
    it('renders the pie chart when there is data', () => {
        render(<StatusChart statusBreakdown={{ APPLIED: 3, REJECTED: 2 }} />);
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });

    it('renders the chart title', () => {
        render(<StatusChart statusBreakdown={{ APPLIED: 3 }} />);
        expect(screen.getByText(/status breakdown/i)).toBeInTheDocument();
    });

    it('shows empty state when all counts are zero', () => {
        render(<StatusChart statusBreakdown={{ APPLIED: 0, REJECTED: 0 }} />);
        expect(screen.getByText(/no applications yet/i)).toBeInTheDocument();
        expect(screen.queryByTestId('pie-chart')).not.toBeInTheDocument();
    });

    it('shows empty state when statusBreakdown is empty', () => {
        render(<StatusChart statusBreakdown={{}} />);
        expect(screen.getByText(/no applications yet/i)).toBeInTheDocument();
    });

    it('filters out zero-count statuses from pie slices', () => {
        render(<StatusChart statusBreakdown={{ APPLIED: 5, SCREENING: 0, REJECTED: 2 }} />);
        const pie = screen.getByTestId('pie');
        // Only APPLIED and REJECTED have non-zero counts
        expect(pie).toHaveAttribute('data-slices', '2');
    });

    it('renders legend with status labels', () => {
        render(<StatusChart statusBreakdown={{ APPLIED: 3, REJECTED: 2 }} />);
        expect(screen.getByTestId('legend')).toBeInTheDocument();
        expect(screen.getByText('Applied')).toBeInTheDocument();
        expect(screen.getByText('Rejected')).toBeInTheDocument();
    });
});
