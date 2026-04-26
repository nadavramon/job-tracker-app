import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CredentialCell from '@/components/applications/CredentialCell';
import * as applicationService from '@/lib/applicationService';

const mockToast = { success: jest.fn(), error: jest.fn() };
jest.mock('@/context/ToastContext', () => ({
    useToast: () => ({ toast: mockToast }),
}));

jest.mock('@/lib/applicationService');
const mockedGetCredentials = applicationService.getCredentials as jest.MockedFunction<typeof applicationService.getCredentials>;

beforeEach(() => {
    jest.clearAllMocks();
});

describe('CredentialCell', () => {
    // --- No credentials ---

    it('renders a dash when hasCredentials is false', () => {
        render(<CredentialCell applicationId="abc" hasCredentials={false} />);
        expect(screen.getByText('—')).toBeInTheDocument();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    // --- Default hidden state ---

    it('shows masked values by default when hasCredentials is true', () => {
        render(<CredentialCell applicationId="abc" hasCredentials={true} />);
        const masks = screen.getAllByText('••••••••');
        expect(masks).toHaveLength(2);
    });

    it('shows "Show credentials" button label in hidden state', () => {
        render(<CredentialCell applicationId="abc" hasCredentials={true} />);
        expect(screen.getByRole('button', { name: 'Show credentials' })).toBeInTheDocument();
    });

    // --- Fetching and revealing ---

    it('fetches and reveals credentials after clicking the toggle', async () => {
        mockedGetCredentials.mockResolvedValue({ username: 'alice', password: 'secret' });
        render(<CredentialCell applicationId="abc" hasCredentials={true} />);
        fireEvent.click(screen.getByRole('button', { name: 'Show credentials' }));

        await waitFor(() => {
            expect(screen.getByText('alice')).toBeInTheDocument();
        });
        expect(screen.getByText('secret')).toBeInTheDocument();
        expect(mockedGetCredentials).toHaveBeenCalledWith('abc');
    });

    it('shows "Hide credentials" button label when visible', async () => {
        mockedGetCredentials.mockResolvedValue({ username: 'alice', password: 'secret' });
        render(<CredentialCell applicationId="abc" hasCredentials={true} />);
        fireEvent.click(screen.getByRole('button', { name: 'Show credentials' }));

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Hide credentials' })).toBeInTheDocument();
        });
    });

    it('hides credentials and clears cached data after a second toggle', async () => {
        mockedGetCredentials.mockResolvedValue({ username: 'alice', password: 'secret' });
        render(<CredentialCell applicationId="abc" hasCredentials={true} />);
        fireEvent.click(screen.getByRole('button', { name: 'Show credentials' }));

        await waitFor(() => {
            expect(screen.getByText('alice')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: 'Hide credentials' }));
        expect(screen.getAllByText('••••••••')).toHaveLength(2);
        expect(screen.queryByText('alice')).not.toBeInTheDocument();
    });

    it('re-fetches when revealing again after hiding (credentials not cached)', async () => {
        mockedGetCredentials.mockResolvedValue({ username: 'alice', password: 'secret' });
        render(<CredentialCell applicationId="abc" hasCredentials={true} />);

        // First reveal
        fireEvent.click(screen.getByRole('button', { name: 'Show credentials' }));
        await waitFor(() => {
            expect(screen.getByText('alice')).toBeInTheDocument();
        });

        // Hide
        fireEvent.click(screen.getByRole('button', { name: 'Hide credentials' }));

        // Reveal again — must re-fetch (credentials cleared on hide)
        fireEvent.click(screen.getByRole('button', { name: 'Show credentials' }));
        await waitFor(() => {
            expect(screen.getByText('alice')).toBeInTheDocument();
        });
        expect(mockedGetCredentials).toHaveBeenCalledTimes(2);
    });

    // --- Username only ---

    it('renders only username when password is null', async () => {
        mockedGetCredentials.mockResolvedValue({ username: 'alice', password: null });
        render(<CredentialCell applicationId="abc" hasCredentials={true} />);
        fireEvent.click(screen.getByRole('button', { name: 'Show credentials' }));

        await waitFor(() => {
            expect(screen.getByText('alice')).toBeInTheDocument();
        });
        expect(screen.queryByText('pass:')).not.toBeInTheDocument();
    });

    // --- Password only ---

    it('renders only password when username is null', async () => {
        mockedGetCredentials.mockResolvedValue({ username: null, password: 'secret' });
        render(<CredentialCell applicationId="abc" hasCredentials={true} />);
        fireEvent.click(screen.getByRole('button', { name: 'Show credentials' }));

        await waitFor(() => {
            expect(screen.getByText('secret')).toBeInTheDocument();
        });
        expect(screen.queryByText('user:')).not.toBeInTheDocument();
    });

    // --- Error handling ---

    it('shows error toast when fetch fails', async () => {
        mockedGetCredentials.mockRejectedValue(new Error('Network error'));
        render(<CredentialCell applicationId="abc" hasCredentials={true} />);
        fireEvent.click(screen.getByRole('button', { name: 'Show credentials' }));

        await waitFor(() => {
            expect(mockToast.error).toHaveBeenCalled();
        });
        expect(screen.getAllByText('••••••••')).toHaveLength(2);
    });
});
