import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import StatusSelect from '@/components/applications/StatusSelect';
import { updateApplication } from '@/lib/applicationService';

jest.mock('@/lib/applicationService', () => ({
    updateApplication: jest.fn(),
}));

jest.mock('@/context/ToastContext', () => ({
    useToast: () => ({
        toast: {
            success: jest.fn(),
            error: jest.fn(),
        },
    }),
}));

const mockUpdateApplication = updateApplication as jest.Mock;

const defaultProps = {
    applicationId: 'app-1',
    status: 'APPLIED' as const,
    onStatusChange: jest.fn(),
};

describe('StatusSelect', () => {
    beforeEach(() => jest.clearAllMocks());

    // --- Idle state ---

    it('renders the status badge in idle state', () => {
        render(<StatusSelect {...defaultProps} />);
        expect(screen.getByRole('button', { name: /status: applied/i })).toBeInTheDocument();
        expect(screen.getByText('Applied')).toBeInTheDocument();
    });

    it('does not show select dropdown in idle state', () => {
        render(<StatusSelect {...defaultProps} />);
        expect(screen.queryByRole('combobox', { name: /change status/i })).not.toBeInTheDocument();
    });

    // --- Editing state ---

    it('opens dropdown when badge is clicked', () => {
        render(<StatusSelect {...defaultProps} />);
        fireEvent.click(screen.getByRole('button', { name: /status: applied/i }));
        expect(screen.getByRole('combobox', { name: /change status/i })).toBeInTheDocument();
    });

    it('pre-fills dropdown with current status', () => {
        render(<StatusSelect {...defaultProps} status="INTERVIEWING" />);
        fireEvent.click(screen.getByRole('button', { name: /status: interviewing/i }));
        expect(screen.getByRole('combobox', { name: /change status/i })).toHaveValue('INTERVIEWING');
    });

    it('renders all 6 status options in the dropdown', () => {
        render(<StatusSelect {...defaultProps} />);
        fireEvent.click(screen.getByRole('button', { name: /status: applied/i }));
        const select = screen.getByRole('combobox', { name: /change status/i });
        const options = Array.from(select.querySelectorAll('option')).map(o => o.value);
        expect(options).toEqual(['APPLIED', 'SCREENING', 'INTERVIEWING', 'OFFER', 'REJECTED', 'WITHDRAWN']);
    });

    it('closes dropdown on Escape without saving', () => {
        render(<StatusSelect {...defaultProps} />);
        fireEvent.click(screen.getByRole('button', { name: /status: applied/i }));
        fireEvent.keyDown(screen.getByRole('combobox', { name: /change status/i }), { key: 'Escape' });
        expect(screen.queryByRole('combobox', { name: /change status/i })).not.toBeInTheDocument();
        expect(mockUpdateApplication).not.toHaveBeenCalled();
    });

    // --- Saving on Enter ---

    it('shows spinner while saving', async () => {
        mockUpdateApplication.mockReturnValue(new Promise(() => {})); // never resolves
        render(<StatusSelect {...defaultProps} />);
        fireEvent.click(screen.getByRole('button', { name: /status: applied/i }));
        fireEvent.change(screen.getByRole('combobox', { name: /change status/i }), {
            target: { value: 'OFFER' },
        });
        fireEvent.keyDown(screen.getByRole('combobox', { name: /change status/i }), { key: 'Enter' });
        expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
    });

    it('saves and calls onStatusChange on Enter', async () => {
        mockUpdateApplication.mockResolvedValue({});
        const onStatusChange = jest.fn();
        render(<StatusSelect {...defaultProps} onStatusChange={onStatusChange} />);
        fireEvent.click(screen.getByRole('button', { name: /status: applied/i }));
        fireEvent.change(screen.getByRole('combobox', { name: /change status/i }), {
            target: { value: 'OFFER' },
        });
        fireEvent.keyDown(screen.getByRole('combobox', { name: /change status/i }), { key: 'Enter' });
        await waitFor(() =>
            expect(onStatusChange).toHaveBeenCalledWith('app-1', 'OFFER'),
        );
        expect(mockUpdateApplication).toHaveBeenCalledWith('app-1', { status: 'OFFER' });
    });

    // --- Saving on blur ---

    it('saves on blur when value changed', async () => {
        mockUpdateApplication.mockResolvedValue({});
        const onStatusChange = jest.fn();
        render(<StatusSelect {...defaultProps} onStatusChange={onStatusChange} />);
        fireEvent.click(screen.getByRole('button', { name: /status: applied/i }));
        fireEvent.change(screen.getByRole('combobox', { name: /change status/i }), {
            target: { value: 'SCREENING' },
        });
        fireEvent.blur(screen.getByRole('combobox', { name: /change status/i }));
        await waitFor(() =>
            expect(onStatusChange).toHaveBeenCalledWith('app-1', 'SCREENING'),
        );
    });

    it('does not PATCH when blur fires with no change', async () => {
        render(<StatusSelect {...defaultProps} />);
        fireEvent.click(screen.getByRole('button', { name: /status: applied/i }));
        // blur without changing value
        fireEvent.blur(screen.getByRole('combobox', { name: /change status/i }));
        await waitFor(() =>
            expect(screen.getByRole('button', { name: /status: applied/i })).toBeInTheDocument(),
        );
        expect(mockUpdateApplication).not.toHaveBeenCalled();
    });

    // --- After success ---

    it('shows updated badge after successful save', async () => {
        mockUpdateApplication.mockResolvedValue({});
        render(<StatusSelect {...defaultProps} />);
        fireEvent.click(screen.getByRole('button', { name: /status: applied/i }));
        fireEvent.change(screen.getByRole('combobox', { name: /change status/i }), {
            target: { value: 'OFFER' },
        });
        fireEvent.blur(screen.getByRole('combobox', { name: /change status/i }));
        await waitFor(() =>
            expect(screen.getByRole('button', { name: /status: offer/i })).toBeInTheDocument(),
        );
        expect(screen.getByText('Offer')).toBeInTheDocument();
    });

    // --- On failure ---

    it('reverts to previous status on save failure', async () => {
        mockUpdateApplication.mockRejectedValue(new Error('Network error'));
        render(<StatusSelect {...defaultProps} />);
        fireEvent.click(screen.getByRole('button', { name: /status: applied/i }));
        fireEvent.change(screen.getByRole('combobox', { name: /change status/i }), {
            target: { value: 'OFFER' },
        });
        fireEvent.blur(screen.getByRole('combobox', { name: /change status/i }));
        await waitFor(() =>
            expect(screen.getByRole('button', { name: /status: applied/i })).toBeInTheDocument(),
        );
        expect(screen.queryByText('Offer')).not.toBeInTheDocument();
    });

    it('does not call onStatusChange on failure', async () => {
        mockUpdateApplication.mockRejectedValue(new Error('fail'));
        const onStatusChange = jest.fn();
        render(<StatusSelect {...defaultProps} onStatusChange={onStatusChange} />);
        fireEvent.click(screen.getByRole('button', { name: /status: applied/i }));
        fireEvent.change(screen.getByRole('combobox', { name: /change status/i }), {
            target: { value: 'REJECTED' },
        });
        fireEvent.blur(screen.getByRole('combobox', { name: /change status/i }));
        await waitFor(() => screen.getByRole('button', { name: /status: applied/i }));
        expect(onStatusChange).not.toHaveBeenCalled();
    });
});
