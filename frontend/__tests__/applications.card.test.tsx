import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ApplicationCard from '@/components/applications/ApplicationCard';
import { Application } from '@/types';

const mockToast = { success: jest.fn(), error: jest.fn(), info: jest.fn(), warning: jest.fn() };
jest.mock('@/context/ToastContext', () => ({ useToast: () => ({ toast: mockToast }) }));

const makeApp = (overrides: Partial<Application> = {}): Application => ({
    id: 'app-1',
    companyName: 'Acme Corp',
    jobRole: 'Software Engineer',
    status: 'APPLIED',
    appliedDate: '2026-01-15',
    location: 'Remote',
    jobType: 'FULL_TIME',
    statusChangedDate: null,
    websiteLink: 'https://acme.com',
    username: null,
    password: null,
    ...overrides,
});

const noop = () => {};

describe('ApplicationCard', () => {
    it('renders company name', () => {
        render(<ApplicationCard application={makeApp()} onEdit={noop} onDelete={noop} />);
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    it('renders job role', () => {
        render(<ApplicationCard application={makeApp()} onEdit={noop} onDelete={noop} />);
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    it('renders status badge', () => {
        render(<ApplicationCard application={makeApp()} onEdit={noop} onDelete={noop} />);
        expect(screen.getByText('Applied')).toBeInTheDocument();
    });

    it('renders applied date', () => {
        render(<ApplicationCard application={makeApp()} onEdit={noop} onDelete={noop} />);
        expect(screen.getByText('2026-01-15')).toBeInTheDocument();
    });

    it('renders location and job type', () => {
        render(<ApplicationCard application={makeApp()} onEdit={noop} onDelete={noop} />);
        expect(screen.getByText('Remote')).toBeInTheDocument();
        expect(screen.getByText('Full-time')).toBeInTheDocument();
    });

    it('renders correct status badge for OFFER', () => {
        render(<ApplicationCard application={makeApp({ status: 'OFFER' })} onEdit={noop} onDelete={noop} />);
        expect(screen.getByText('Offer')).toBeInTheDocument();
    });

    it('calls onEdit when Edit is clicked in the kebab menu', async () => {
        const onEdit = jest.fn();
        render(<ApplicationCard application={makeApp()} onEdit={onEdit} onDelete={noop} />);

        fireEvent.click(screen.getByRole('button', { name: /row actions/i }));
        await waitFor(() => screen.getByRole('menuitem', { name: /edit/i }));
        fireEvent.click(screen.getByRole('menuitem', { name: /edit/i }));

        expect(onEdit).toHaveBeenCalled();
    });

    it('calls onDelete when Delete is clicked in the kebab menu', async () => {
        const onDelete = jest.fn();
        render(<ApplicationCard application={makeApp()} onEdit={noop} onDelete={onDelete} />);

        fireEvent.click(screen.getByRole('button', { name: /row actions/i }));
        await waitFor(() => screen.getByRole('menuitem', { name: /delete/i }));
        fireEvent.click(screen.getByRole('menuitem', { name: /delete/i }));

        expect(onDelete).toHaveBeenCalled();
    });
});
