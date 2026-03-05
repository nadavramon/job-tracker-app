import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import NewApplicationPage from '@/app/(app)/applications/new/page';
import { createApplication } from '@/lib/applicationService';
import { isAuthenticated } from '@/lib/auth';

jest.mock('@/lib/applicationService', () => ({
    createApplication: jest.fn(),
}));

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
}));

const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
};
jest.mock('@/context/ToastContext', () => ({
    useToast: () => ({ toast: mockToast }),
}));

jest.mock('@/lib/auth', () => ({
    isAuthenticated: jest.fn(() => true),
}));

const mockIsAuthenticated = isAuthenticated as jest.Mock;
const mockCreateApplication = createApplication as jest.Mock;

beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated.mockReturnValue(true);
});

describe('NewApplicationPage', () => {
    it('redirects to /login when not authenticated', () => {
        mockIsAuthenticated.mockReturnValueOnce(false);
        render(<NewApplicationPage />);
        expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('renders the page heading and main form fields', () => {
        render(<NewApplicationPage />);

        expect(screen.getByRole('heading', { name: /new application/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/job role/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/applied date/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/job type/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/website link/i)).toBeInTheDocument();
    });

    it('defaults applied date to today (local time)', () => {
        render(<NewApplicationPage />);
        const d = new Date();
        const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        expect(screen.getByLabelText(/applied date/i)).toHaveValue(today);
    });

    it('defaults status to APPLIED', () => {
        render(<NewApplicationPage />);
        expect(screen.getByLabelText(/status/i)).toHaveValue('APPLIED');
    });

    it('hides portal credential fields by default (collapsed)', () => {
        render(<NewApplicationPage />);
        expect(screen.queryByLabelText(/portal username/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/portal password/i, { selector: 'input' })).not.toBeInTheDocument();
    });

    it('shows credential fields after clicking Portal Credentials toggle', () => {
        render(<NewApplicationPage />);

        fireEvent.click(screen.getByRole('button', { name: /portal credentials/i }));

        expect(screen.getByLabelText(/portal username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/portal password/i, { selector: 'input' })).toBeInTheDocument();
    });

    it('hides credential fields again after toggling twice', () => {
        render(<NewApplicationPage />);

        const toggle = screen.getByRole('button', { name: /portal credentials/i });
        fireEvent.click(toggle);
        fireEvent.click(toggle);

        expect(screen.queryByLabelText(/portal username/i)).not.toBeInTheDocument();
    });

    it('calls createApplication and redirects to /dashboard on successful submit', async () => {
        mockCreateApplication.mockResolvedValueOnce({ id: 'new-id', companyName: 'Acme Corp' });

        render(<NewApplicationPage />);

        fireEvent.change(screen.getByLabelText(/company name/i), { target: { value: 'Acme Corp' } });
        fireEvent.change(screen.getByLabelText(/job role/i), { target: { value: 'Developer' } });
        fireEvent.change(screen.getByLabelText(/location/i), { target: { value: 'Remote' } });

        fireEvent.click(screen.getByRole('button', { name: /create application/i }));

        await waitFor(() => {
            expect(mockCreateApplication).toHaveBeenCalledWith(expect.objectContaining({
                companyName: 'Acme Corp',
                jobRole: 'Developer',
                location: 'Remote',
                status: 'APPLIED',
                jobType: 'FULL_TIME',
            }));
            expect(mockToast.success).toHaveBeenCalledWith('Application created');
            expect(mockPush).toHaveBeenCalledWith('/dashboard');
        });
    });

    it('sends null for blank optional fields', async () => {
        mockCreateApplication.mockResolvedValueOnce({ id: 'new-id' });

        render(<NewApplicationPage />);

        fireEvent.change(screen.getByLabelText(/company name/i), { target: { value: 'Acme' } });
        fireEvent.change(screen.getByLabelText(/job role/i), { target: { value: 'Dev' } });
        fireEvent.change(screen.getByLabelText(/location/i), { target: { value: 'NYC' } });

        fireEvent.click(screen.getByRole('button', { name: /create application/i }));

        await waitFor(() => {
            expect(mockCreateApplication).toHaveBeenCalledWith(expect.objectContaining({
                websiteLink: null,
                username: null,
                password: null,
            }));
        });
    });

    it('shows error toast and does not redirect on API failure', async () => {
        mockCreateApplication.mockRejectedValueOnce(new Error('Network error'));

        render(<NewApplicationPage />);

        fireEvent.change(screen.getByLabelText(/company name/i), { target: { value: 'Acme' } });
        fireEvent.change(screen.getByLabelText(/job role/i), { target: { value: 'Dev' } });
        fireEvent.change(screen.getByLabelText(/location/i), { target: { value: 'NYC' } });

        fireEvent.click(screen.getByRole('button', { name: /create application/i }));

        await waitFor(() => {
            expect(mockToast.error).toHaveBeenCalled();
            expect(mockPush).not.toHaveBeenCalled();
        });
    });

    it('shows validation errors when required fields are empty', async () => {
        render(<NewApplicationPage />);

        // Clear fields that have defaults
        fireEvent.change(screen.getByLabelText(/applied date/i), { target: { value: '' } });

        fireEvent.click(screen.getByRole('button', { name: /create application/i }));

        await waitFor(() => {
            expect(screen.getByText('Company name is required')).toBeInTheDocument();
            expect(screen.getByText('Job role is required')).toBeInTheDocument();
            expect(screen.getByText('Location is required')).toBeInTheDocument();
            expect(screen.getByText('Applied date is required')).toBeInTheDocument();
        });

        expect(mockCreateApplication).not.toHaveBeenCalled();
    });

    it('navigates to /dashboard when Cancel is clicked', () => {
        render(<NewApplicationPage />);

        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

        expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
});
