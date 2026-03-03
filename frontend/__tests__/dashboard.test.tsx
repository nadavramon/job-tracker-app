import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import DashboardPage from '@/app/(app)/dashboard/page';
import { getApplications, getStats } from '@/lib/applicationService';
import { isAuthenticated } from '@/lib/auth';
import { Application, StatsResponse } from '@/types';

// Mock the modules
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/applicationService', () => ({
  getApplications: jest.fn(),
  getStats: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  isAuthenticated: jest.fn(),
  removeToken: jest.fn(),
}));

jest.mock('@/components/dashboard/ApplicationsChart', () => function ApplicationsChart() { return <div data-testid="applications-chart" />; });
jest.mock('@/components/dashboard/StatusChart', () => function StatusChart() { return <div data-testid="status-chart" />; });

const mockApplications: Application[] = [
  {
    id: '1',
    companyName: 'Google',
    jobType: 'FULL_TIME',
    location: 'Tel Aviv',
    jobRole: 'Developer',
    appliedDate: '2026-01-20',
    status: 'APPLIED',
    statusChangedDate: null,
    websiteLink: 'https://google.com',
    username: null,
    password: null,
  },
  {
    id: '2',
    companyName: 'Microsoft',
    jobType: 'FULL_TIME',
    location: 'Herzliya',
    jobRole: 'Engineer',
    appliedDate: '2026-01-21',
    status: 'INTERVIEWING',
    statusChangedDate: null,
    websiteLink: 'https://microsoft.com',
    username: null,
    password: null,
  },
];

const mockStats: StatsResponse = {
  totalApplications: 2,
  statusBreakdown: { APPLIED: 1, INTERVIEWING: 1 },
  monthlyApplications: [],
  responseRate: 0.5,
};

describe('DashboardPage', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (getStats as jest.Mock).mockResolvedValue(mockStats);
  });

  it('redirects to login if not authenticated', async () => {
    (isAuthenticated as jest.Mock).mockReturnValue(false);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('shows loading state initially', () => {
    (isAuthenticated as jest.Mock).mockReturnValue(true);
    (getApplications as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<DashboardPage />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays applications when loaded', async () => {
    (isAuthenticated as jest.Mock).mockReturnValue(true);
    (getApplications as jest.Mock).mockResolvedValue(mockApplications);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Google')).toBeInTheDocument();
      expect(screen.getByText('Microsoft')).toBeInTheDocument();
      expect(screen.getByText('Developer')).toBeInTheDocument();
      expect(screen.getByText('Engineer')).toBeInTheDocument();
    });
  });

  it('displays status badges with correct text', async () => {
    (isAuthenticated as jest.Mock).mockReturnValue(true);
    (getApplications as jest.Mock).mockResolvedValue(mockApplications);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('APPLIED')).toBeInTheDocument();
      expect(screen.getByText('INTERVIEWING')).toBeInTheDocument();
    });
  });

  it('shows empty state when no applications exist', async () => {
    (isAuthenticated as jest.Mock).mockReturnValue(true);
    (getApplications as jest.Mock).mockResolvedValue([]);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/no applications yet/i)).toBeInTheDocument();
      expect(screen.getByText(/add your first application/i)).toBeInTheDocument();
    });
  });

  it('shows error message when fetch fails', async () => {
    (isAuthenticated as jest.Mock).mockReturnValue(true);
    (getApplications as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load applications/i)).toBeInTheDocument();
    });
  });

  it('renders logout button', async () => {
    (isAuthenticated as jest.Mock).mockReturnValue(true);
    (getApplications as jest.Mock).mockResolvedValue([]);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/logout/i)).toBeInTheDocument();
    });
  });
});