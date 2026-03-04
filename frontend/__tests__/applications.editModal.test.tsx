import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import EditModal from '@/components/applications/EditModal';
import { updateApplication } from '@/lib/applicationService';
import { Application } from '@/types';

jest.mock('@/lib/applicationService', () => ({
    updateApplication: jest.fn(),
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

const mockUpdateApplication = updateApplication as jest.Mock;

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
    username: 'myuser',
    password: 'stored-password',
    ...overrides,
});

const noop = () => {};

beforeEach(() => {
    jest.clearAllMocks();
});

describe('EditModal', () => {
    it('does not render when application is null', () => {
        render(<EditModal application={null} onClose={noop} onSaved={noop} />);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders modal with Edit application title when open', () => {
        render(<EditModal application={makeApp()} onClose={noop} onSaved={noop} />);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Edit application')).toBeInTheDocument();
    });

    it('pre-fills all fields except password from the application', () => {
        render(<EditModal application={makeApp()} onClose={noop} onSaved={noop} />);

        expect(screen.getByLabelText(/company name/i)).toHaveValue('Acme Corp');
        expect(screen.getByLabelText(/job role/i)).toHaveValue('Software Engineer');
        expect(screen.getByLabelText(/location/i)).toHaveValue('Remote');
        expect(screen.getByLabelText(/applied date/i)).toHaveValue('2026-01-15');
        expect(screen.getByLabelText(/status/i)).toHaveValue('APPLIED');
        expect(screen.getByLabelText(/job type/i)).toHaveValue('FULL_TIME');
        expect(screen.getByLabelText(/website link/i)).toHaveValue('https://acme.com');
        expect(screen.getByLabelText(/portal username/i)).toHaveValue('myuser');
    });

    it('does not pre-fill the portal password field (write-only)', () => {
        render(<EditModal application={makeApp()} onClose={noop} onSaved={noop} />);
        expect(screen.getByLabelText(/portal password/i, { selector: 'input' })).toHaveValue('');
    });

    it('pre-fills empty strings for null optional fields', () => {
        render(<EditModal application={makeApp({ websiteLink: null, username: null, password: null })} onClose={noop} onSaved={noop} />);

        expect(screen.getByLabelText(/website link/i)).toHaveValue('');
        expect(screen.getByLabelText(/portal username/i)).toHaveValue('');
        expect(screen.getByLabelText(/portal password/i, { selector: 'input' })).toHaveValue('');
    });

    it('shows validation errors when required fields are empty', async () => {
        render(
            <EditModal
                application={makeApp({ companyName: '', jobRole: '', location: '', appliedDate: '' })}
                onClose={noop}
                onSaved={noop}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

        await waitFor(() => {
            expect(screen.getByText('Company name is required')).toBeInTheDocument();
            expect(screen.getByText('Job role is required')).toBeInTheDocument();
            expect(screen.getByText('Location is required')).toBeInTheDocument();
            expect(screen.getByText('Applied date is required')).toBeInTheDocument();
        });

        expect(mockUpdateApplication).not.toHaveBeenCalled();
    });

    it('shows validation error for non-http website link', async () => {
        render(<EditModal application={makeApp({ websiteLink: 'javascript:alert(1)' })} onClose={noop} onSaved={noop} />);

        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

        await waitFor(() => {
            expect(screen.getByText('Website link must start with http:// or https://')).toBeInTheDocument();
        });

        expect(mockUpdateApplication).not.toHaveBeenCalled();
    });

    it('calls updateApplication with correct payload on valid submit (no password change)', async () => {
        const app = makeApp();
        const updated = { ...app, jobRole: 'Senior Engineer' };
        mockUpdateApplication.mockResolvedValueOnce(updated);

        const onSaved = jest.fn();
        render(<EditModal application={app} onClose={noop} onSaved={onSaved} />);

        fireEvent.change(screen.getByLabelText(/job role/i), { target: { value: 'Senior Engineer' } });
        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

        await waitFor(() => {
            expect(mockUpdateApplication).toHaveBeenCalledWith('app-1', expect.objectContaining({
                companyName: 'Acme Corp',
                jobRole: 'Senior Engineer',
                location: 'Remote',
                appliedDate: '2026-01-15',
                status: 'APPLIED',
                jobType: 'FULL_TIME',
                websiteLink: 'https://acme.com',
                username: 'myuser',
            }));
            // password not included when field is blank
            expect(mockUpdateApplication).toHaveBeenCalledWith('app-1',
                expect.not.objectContaining({ password: expect.anything() })
            );
        });
    });

    it('includes password in payload only when the user types a new one', async () => {
        const app = makeApp();
        mockUpdateApplication.mockResolvedValueOnce(app);

        render(<EditModal application={app} onClose={noop} onSaved={noop} />);

        fireEvent.change(
            screen.getByLabelText(/portal password/i, { selector: 'input' }),
            { target: { value: 'new-password' } }
        );
        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

        await waitFor(() => {
            expect(mockUpdateApplication).toHaveBeenCalledWith('app-1',
                expect.objectContaining({ password: 'new-password' })
            );
        });
    });

    it('converts empty optional strings to null in API payload', async () => {
        const app = makeApp({ websiteLink: null, username: null, password: null });
        mockUpdateApplication.mockResolvedValueOnce(app);

        render(<EditModal application={app} onClose={noop} onSaved={noop} />);

        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

        await waitFor(() => {
            expect(mockUpdateApplication).toHaveBeenCalledWith('app-1', expect.objectContaining({
                websiteLink: null,
                username: null,
            }));
            expect(mockUpdateApplication).toHaveBeenCalledWith('app-1',
                expect.not.objectContaining({ password: expect.anything() })
            );
        });
    });

    it('calls onSaved with updated application and shows success toast on success', async () => {
        const app = makeApp();
        const updated = { ...app, companyName: 'Updated Corp' };
        mockUpdateApplication.mockResolvedValueOnce(updated);

        const onSaved = jest.fn();
        render(<EditModal application={app} onClose={noop} onSaved={onSaved} />);

        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

        await waitFor(() => {
            expect(mockToast.success).toHaveBeenCalledWith('Application updated');
            expect(onSaved).toHaveBeenCalledWith(updated);
        });
    });

    it('shows error toast and keeps modal open on API failure', async () => {
        mockUpdateApplication.mockRejectedValueOnce(new Error('Network error'));

        const onClose = jest.fn();
        render(<EditModal application={makeApp()} onClose={onClose} onSaved={noop} />);

        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

        await waitFor(() => {
            expect(mockToast.error).toHaveBeenCalled();
        });

        expect(onClose).not.toHaveBeenCalled();
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('calls onClose when Cancel button is clicked', () => {
        const onClose = jest.fn();
        render(<EditModal application={makeApp()} onClose={onClose} onSaved={noop} />);

        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

        expect(onClose).toHaveBeenCalled();
    });

    it('re-opens with correct pre-filled data when a different application is selected', () => {
        const appA = makeApp({ id: 'app-1', companyName: 'Acme Corp' });
        const appB = makeApp({ id: 'app-2', companyName: 'Beta Inc', jobRole: 'Product Manager' });

        const { rerender } = render(<EditModal application={appA} onClose={noop} onSaved={noop} />);
        expect(screen.getByLabelText(/company name/i)).toHaveValue('Acme Corp');

        act(() => {
            rerender(<EditModal application={appB} onClose={noop} onSaved={noop} />);
        });

        expect(screen.getByLabelText(/company name/i)).toHaveValue('Beta Inc');
        expect(screen.getByLabelText(/job role/i)).toHaveValue('Product Manager');
    });
});
