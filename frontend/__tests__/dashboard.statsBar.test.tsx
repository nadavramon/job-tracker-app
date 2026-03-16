import { render, screen } from '@testing-library/react';
import StatsBar from '@/components/dashboard/StatsBar';
import { StatsResponse } from '@/types';

const mockStats: StatsResponse = {
    totalApplications: 10,
    statusBreakdown: {
        APPLIED: 3,
        SCREENING: 2,
        INTERVIEWING: 1,
        OFFER: 1,
        REJECTED: 2,
        WITHDRAWN: 1,
    },
    monthlyApplications: [],
    responseRate: 60.0,
};

describe('StatsBar', () => {
    it('renders total applications count', () => {
        render(<StatsBar stats={mockStats} />);
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText(/total applications/i)).toBeInTheDocument();
    });

    it('renders all status breakdown counts', () => {
        render(<StatsBar stats={mockStats} />);
        expect(screen.getByText('3')).toBeInTheDocument();                   // APPLIED
        expect(screen.getAllByText('2')).toHaveLength(2);                    // SCREENING + REJECTED
        expect(screen.getAllByText('1')).toHaveLength(3);                    // INTERVIEWING + OFFER + WITHDRAWN
    });

    it('renders all status labels', () => {
        render(<StatsBar stats={mockStats} />);
        expect(screen.getByText('Applied')).toBeInTheDocument();
        expect(screen.getByText('Screening')).toBeInTheDocument();
        expect(screen.getByText('Interviewing')).toBeInTheDocument();
        expect(screen.getByText('Offer')).toBeInTheDocument();
        expect(screen.getByText('Rejected')).toBeInTheDocument();
        expect(screen.getByText('Withdrawn')).toBeInTheDocument();
    });

    it('renders response rate as a percentage', () => {
        render(<StatsBar stats={mockStats} />);
        expect(screen.getByText('60%')).toBeInTheDocument();
        expect(screen.getByText(/of applications received a response/i)).toBeInTheDocument();
    });

    it('renders the response rate progress bar with correct width', () => {
        render(<StatsBar stats={mockStats} />);
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '60');
        expect(progressBar).toHaveAttribute('aria-valuemin', '0');
        expect(progressBar).toHaveAttribute('aria-valuemax', '100');
        // The fill div is the direct child
        const fill = progressBar.firstChild as HTMLElement;
        expect(fill).toHaveStyle({ width: '60%' });
    });

    it('shows 0 for statuses missing from statusBreakdown', () => {
        const statsWithMissing: StatsResponse = {
            ...mockStats,
            statusBreakdown: { APPLIED: 5 },
        };
        render(<StatsBar stats={statsWithMissing} />);
        // 5 statuses should show 0
        const zeros = screen.getAllByText('0');
        expect(zeros).toHaveLength(5);
    });

    it('rounds the response rate to the nearest integer', () => {
        const statsWithDecimal: StatsResponse = {
            ...mockStats,
            responseRate: 33.3,
        };
        render(<StatsBar stats={statsWithDecimal} />);
        expect(screen.getByText('33%')).toBeInTheDocument();
    });

    it('shows 0% response rate when responseRate is 0', () => {
        const statsZero: StatsResponse = {
            ...mockStats,
            responseRate: 0,
        };
        render(<StatsBar stats={statsZero} />);
        expect(screen.getByText('0%')).toBeInTheDocument();
        const progressBar = screen.getByRole('progressbar');
        const fill = progressBar.firstChild as HTMLElement;
        expect(fill).toHaveStyle({ width: '0%' });
    });
});
