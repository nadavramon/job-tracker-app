import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ProfileSection from '@/components/settings/ProfileSection';
import { getProfile, updateProfile } from '@/lib/userService';
import { UserProfileResponse } from '@/types';

jest.mock('@/lib/userService', () => ({
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
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

const mockGetProfile = getProfile as jest.Mock;
const mockUpdateProfile = updateProfile as jest.Mock;

const fakeProfile: UserProfileResponse = {
    id: 'user-1',
    username: 'johndoe',
    email: 'john@example.com',
    themePreference: 'SYSTEM',
    hasApiKey: false,
};

beforeEach(() => {
    jest.clearAllMocks();
    mockGetProfile.mockResolvedValue(fakeProfile);
});

async function renderAndWait() {
    render(<ProfileSection />);
    await waitFor(() => expect(screen.getByLabelText(/email/i)).toBeInTheDocument());
}

describe('ProfileSection', () => {
    it('shows a loading skeleton while fetching profile', () => {
        mockGetProfile.mockReturnValue(new Promise(() => {})); // never resolves
        render(<ProfileSection />);
        expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
    });

    it('shows an error banner when profile load fails', async () => {
        mockGetProfile.mockRejectedValueOnce(new Error('Network error'));
        render(<ProfileSection />);
        await waitFor(() => {
            expect(screen.getByText(/failed to load profile/i)).toBeInTheDocument();
        });
    });

    it('pre-fills email from loaded profile', async () => {
        await renderAndWait();
        expect(screen.getByLabelText(/email/i)).toHaveValue('john@example.com');
    });

    it('shows "Change password" link and no password fields initially', async () => {
        await renderAndWait();
        expect(screen.getByRole('button', { name: /change password/i })).toBeInTheDocument();
        expect(screen.queryByLabelText(/current password/i, { selector: 'input' })).not.toBeInTheDocument();
    });

    it('reveals password fields when "Change password" is clicked', async () => {
        await renderAndWait();
        fireEvent.click(screen.getByRole('button', { name: /change password/i }));
        expect(screen.getByLabelText(/current password/i, { selector: 'input' })).toBeInTheDocument();
        expect(screen.getByLabelText(/^new password$/i, { selector: 'input' })).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm new password/i, { selector: 'input' })).toBeInTheDocument();
    });

    it('hides password fields when Cancel is clicked', async () => {
        await renderAndWait();
        fireEvent.click(screen.getByRole('button', { name: /change password/i }));
        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
        expect(screen.queryByLabelText(/current password/i, { selector: 'input' })).not.toBeInTheDocument();
    });

    it('shows validation error when current password is empty', async () => {
        await renderAndWait();
        fireEvent.click(screen.getByRole('button', { name: /change password/i }));
        fireEvent.change(screen.getByLabelText(/^new password$/i, { selector: 'input' }), { target: { value: 'newpass123' } });
        fireEvent.change(screen.getByLabelText(/confirm new password/i, { selector: 'input' }), { target: { value: 'newpass123' } });
        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
        await waitFor(() => {
            expect(screen.getByText(/enter your current password/i)).toBeInTheDocument();
        });
        expect(mockUpdateProfile).not.toHaveBeenCalled();
    });

    it('shows validation error for new password shorter than 8 chars', async () => {
        await renderAndWait();
        fireEvent.click(screen.getByRole('button', { name: /change password/i }));
        fireEvent.change(screen.getByLabelText(/current password/i, { selector: 'input' }), { target: { value: 'oldpass' } });
        fireEvent.change(screen.getByLabelText(/^new password$/i, { selector: 'input' }), { target: { value: 'short' } });
        fireEvent.change(screen.getByLabelText(/confirm new password/i, { selector: 'input' }), { target: { value: 'short' } });
        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
        await waitFor(() => {
            expect(screen.getByText(/password must be 8–14 characters/i)).toBeInTheDocument();
        });
        expect(mockUpdateProfile).not.toHaveBeenCalled();
    });

    it('shows validation error when passwords do not match', async () => {
        await renderAndWait();
        fireEvent.click(screen.getByRole('button', { name: /change password/i }));
        fireEvent.change(screen.getByLabelText(/current password/i, { selector: 'input' }), { target: { value: 'oldpass' } });
        fireEvent.change(screen.getByLabelText(/^new password$/i, { selector: 'input' }), { target: { value: 'newpass123' } });
        fireEvent.change(screen.getByLabelText(/confirm new password/i, { selector: 'input' }), { target: { value: 'different1' } });
        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
        await waitFor(() => {
            expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
        });
        expect(mockUpdateProfile).not.toHaveBeenCalled();
    });

    it('shows info toast and skips API call when nothing changed', async () => {
        await renderAndWait();
        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
        await waitFor(() => {
            expect(mockToast.info).toHaveBeenCalledWith('No changes to save');
        });
        expect(mockUpdateProfile).not.toHaveBeenCalled();
    });

    it('sends only changed fields — email only', async () => {
        mockUpdateProfile.mockResolvedValueOnce({ ...fakeProfile, email: 'new@example.com' });
        await renderAndWait();
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@example.com' } });
        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
        await waitFor(() => {
            expect(mockUpdateProfile).toHaveBeenCalledWith({ email: 'new@example.com' });
            expect(mockToast.success).toHaveBeenCalledWith('Profile updated');
        });
    });

    it('sends password in payload when password fields are filled correctly', async () => {
        mockUpdateProfile.mockResolvedValueOnce(fakeProfile);
        await renderAndWait();
        fireEvent.click(screen.getByRole('button', { name: /change password/i }));
        fireEvent.change(screen.getByLabelText(/current password/i, { selector: 'input' }), { target: { value: 'oldpass1' } });
        fireEvent.change(screen.getByLabelText(/^new password$/i, { selector: 'input' }), { target: { value: 'newpass12' } });
        fireEvent.change(screen.getByLabelText(/confirm new password/i, { selector: 'input' }), { target: { value: 'newpass12' } });
        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
        await waitFor(() => {
            expect(mockUpdateProfile).toHaveBeenCalledWith({ currentPassword: 'oldpass1', password: 'newpass12' });
            expect(mockToast.success).toHaveBeenCalledWith('Profile updated');
        });
    });

    it('hides password fields after successful password change', async () => {
        mockUpdateProfile.mockResolvedValueOnce(fakeProfile);
        await renderAndWait();
        fireEvent.click(screen.getByRole('button', { name: /change password/i }));
        fireEvent.change(screen.getByLabelText(/current password/i, { selector: 'input' }), { target: { value: 'oldpass1' } });
        fireEvent.change(screen.getByLabelText(/^new password$/i, { selector: 'input' }), { target: { value: 'newpass12' } });
        fireEvent.change(screen.getByLabelText(/confirm new password/i, { selector: 'input' }), { target: { value: 'newpass12' } });
        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
        await waitFor(() => {
            expect(screen.queryByLabelText(/current password/i, { selector: 'input' })).not.toBeInTheDocument();
        });
    });

    it('shows error toast on API failure', async () => {
        mockUpdateProfile.mockRejectedValueOnce(new Error('Server error'));
        await renderAndWait();
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'changed@example.com' } });
        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
        await waitFor(() => {
            expect(mockToast.error).toHaveBeenCalled();
        });
    });

    it('sends currentPassword in the API payload when changing password', async () => {
        mockUpdateProfile.mockResolvedValueOnce(fakeProfile);
        await renderAndWait();
        fireEvent.click(screen.getByRole('button', { name: /change password/i }));
        fireEvent.change(screen.getByLabelText(/current password/i, { selector: 'input' }), { target: { value: 'oldpass1' } });
        fireEvent.change(screen.getByLabelText(/^new password$/i, { selector: 'input' }), { target: { value: 'newpass12' } });
        fireEvent.change(screen.getByLabelText(/confirm new password/i, { selector: 'input' }), { target: { value: 'newpass12' } });
        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
        await waitFor(() => {
            expect(mockUpdateProfile).toHaveBeenCalledWith(expect.objectContaining({
                currentPassword: 'oldpass1',
                password: 'newpass12',
            }));
        });
    });
});
