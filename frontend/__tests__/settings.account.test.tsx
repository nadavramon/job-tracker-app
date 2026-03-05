import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AccountSection from '@/components/settings/AccountSection';
import { deleteAccount } from '@/lib/userService';
import { removeToken, removeUsername } from '@/lib/auth';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/lib/userService', () => ({
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    deleteAccount: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
    removeToken: jest.fn(),
    removeUsername: jest.fn(),
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

const mockDeleteAccount = deleteAccount as jest.Mock;

beforeEach(() => {
    jest.clearAllMocks();
});

describe('AccountSection', () => {
    it('renders the delete account button', () => {
        render(<AccountSection username="johndoe" />);
        expect(screen.getByRole('button', { name: /delete account/i })).toBeInTheDocument();
    });

    it('opens confirmation modal when delete button is clicked', () => {
        render(<AccountSection username="johndoe" />);
        fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/this action is permanent/i)).toBeInTheDocument();
    });

    it('keeps delete button disabled until username is typed correctly', () => {
        render(<AccountSection username="johndoe" />);
        fireEvent.click(screen.getByRole('button', { name: /delete account/i }));

        const confirmInput = screen.getByPlaceholderText('johndoe');
        const deleteBtn = screen.getByRole('button', { name: 'Delete' });

        expect(deleteBtn).toBeDisabled();

        fireEvent.change(confirmInput, { target: { value: 'wrong' } });
        expect(deleteBtn).toBeDisabled();

        fireEvent.change(confirmInput, { target: { value: 'johndoe' } });
        expect(deleteBtn).toBeEnabled();
    });

    it('calls deleteAccount, clears auth, shows toast, and redirects on confirm', async () => {
        mockDeleteAccount.mockResolvedValueOnce(undefined);
        render(<AccountSection username="johndoe" />);

        fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
        fireEvent.change(screen.getByPlaceholderText('johndoe'), { target: { value: 'johndoe' } });
        fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

        await waitFor(() => {
            expect(mockDeleteAccount).toHaveBeenCalled();
            expect(removeToken).toHaveBeenCalled();
            expect(removeUsername).toHaveBeenCalled();
            expect(mockToast.success).toHaveBeenCalledWith('Account deleted');
            expect(mockPush).toHaveBeenCalledWith('/login');
        });
    });

    it('shows error toast on API failure and stays on modal', async () => {
        mockDeleteAccount.mockRejectedValueOnce(new Error('Server error'));
        render(<AccountSection username="johndoe" />);

        fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
        fireEvent.change(screen.getByPlaceholderText('johndoe'), { target: { value: 'johndoe' } });
        fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

        await waitFor(() => {
            expect(mockToast.error).toHaveBeenCalled();
        });
        expect(mockPush).not.toHaveBeenCalled();
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('closes modal when Cancel is clicked', () => {
        render(<AccountSection username="johndoe" />);
        fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
        expect(screen.getByRole('dialog')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('resets confirmation input when modal is reopened', () => {
        render(<AccountSection username="johndoe" />);

        fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
        fireEvent.change(screen.getByPlaceholderText('johndoe'), { target: { value: 'johndoe' } });
        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

        fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
        expect(screen.getByPlaceholderText('johndoe')).toHaveValue('');
    });
});
