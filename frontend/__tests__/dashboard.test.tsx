import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import DashboardPage from '@/app/(app)/dashboard/page';
import { getStats } from '@/lib/applicationService';
import { isAuthenticated } from '@/lib/auth';
import { StatsResponse } from '@/types';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/applicationService', () => ({
  getStats: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  isAuthenticated: jest.fn(),
}));

jest.mock('@/components/dashboard/ApplicationsChart', () =>
  function ApplicationsChart() { return <div data-testid="applications-chart" />; },
);
jest.mock('@/components/dashboard/StatusChart', () =>
  function StatusChart() { return <div data-testid="status-chart" />; },
);
jest.mock('@/components/applications/ApplicationsTable', () =>
  function ApplicationsTable() { return <div data-testid="applications-table" />; },
);

const mockStats: StatsResponse = {
  totalApplications: 5,
  statusBreakdown: { APPLIED: 3, OFFER: 2 },
  monthlyApplications: [],
  responseRate: 40.0,
};

describe('DashboardPage', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  it('redirects to /login if not authenticated', async () => {
    (isAuthenticated as jest.Mock).mockReturnValue(false);
    render(<DashboardPage />);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/login'));
  });

  it('shows loading spinner initially', () => {
    (isAuthenticated as jest.Mock).mockReturnValue(true);
    (getStats as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<DashboardPage />);
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });

  it('renders StatsBar, charts, and table when stats load', async () => {
    (isAuthenticated as jest.Mock).mockReturnValue(true);
    (getStats as jest.Mock).mockResolvedValue(mockStats);
    render(<DashboardPage />);
    await waitFor(() =>
      expect(screen.getByTestId('applications-chart')).toBeInTheDocument(),
    );
    expect(screen.getByTestId('status-chart')).toBeInTheDocument();
    expect(screen.getByTestId('applications-table')).toBeInTheDocument();
  });

  it('always renders ApplicationsTable regardless of stats', async () => {
    (isAuthenticated as jest.Mock).mockReturnValue(true);
    (getStats as jest.Mock).mockRejectedValue(new Error('stats error'));
    render(<DashboardPage />);
    await waitFor(() =>
      expect(screen.getByTestId('applications-table')).toBeInTheDocument(),
    );
  });

  it('shows error message when stats fetch fails', async () => {
    (isAuthenticated as jest.Mock).mockReturnValue(true);
    (getStats as jest.Mock).mockRejectedValue(new Error('Network error'));
    render(<DashboardPage />);
    await waitFor(() =>
      expect(screen.getByText(/failed to load dashboard data/i)).toBeInTheDocument(),
    );
  });
});
