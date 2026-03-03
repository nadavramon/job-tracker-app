import { render, screen, fireEvent } from '@testing-library/react';
import CredentialCell from '@/components/applications/CredentialCell';

describe('CredentialCell', () => {
    // --- No credentials ---

    it('renders a dash when both username and password are null', () => {
        render(<CredentialCell username={null} password={null} />);
        expect(screen.getByText('—')).toBeInTheDocument();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    // --- Default hidden state ---

    it('shows masked values by default when credentials are present', () => {
        render(<CredentialCell username="alice" password="secret" />);
        const masks = screen.getAllByText('••••••••');
        expect(masks).toHaveLength(2);
    });

    it('does not reveal actual values in hidden state', () => {
        render(<CredentialCell username="alice" password="secret" />);
        expect(screen.queryByText('alice')).not.toBeInTheDocument();
        expect(screen.queryByText('secret')).not.toBeInTheDocument();
    });

    it('shows "Show credentials" button label in hidden state', () => {
        render(<CredentialCell username="alice" password="secret" />);
        expect(screen.getByRole('button', { name: 'Show credentials' })).toBeInTheDocument();
    });

    // --- Toggling visible ---

    it('reveals credentials after clicking the toggle', () => {
        render(<CredentialCell username="alice" password="secret" />);
        fireEvent.click(screen.getByRole('button', { name: 'Show credentials' }));
        expect(screen.getByText('alice')).toBeInTheDocument();
        expect(screen.getByText('secret')).toBeInTheDocument();
        expect(screen.queryByText('••••••••')).not.toBeInTheDocument();
    });

    it('shows "Hide credentials" button label when visible', () => {
        render(<CredentialCell username="alice" password="secret" />);
        fireEvent.click(screen.getByRole('button', { name: 'Show credentials' }));
        expect(screen.getByRole('button', { name: 'Hide credentials' })).toBeInTheDocument();
    });

    it('hides credentials again after a second toggle', () => {
        render(<CredentialCell username="alice" password="secret" />);
        fireEvent.click(screen.getByRole('button', { name: 'Show credentials' }));
        fireEvent.click(screen.getByRole('button', { name: 'Hide credentials' }));
        expect(screen.getAllByText('••••••••')).toHaveLength(2);
        expect(screen.queryByText('alice')).not.toBeInTheDocument();
    });

    // --- Username only ---

    it('renders username only when password is null', () => {
        render(<CredentialCell username="alice" password={null} />);
        expect(screen.getByText('user:')).toBeInTheDocument();
        expect(screen.queryByText('pass:')).not.toBeInTheDocument();
        expect(screen.getAllByText('••••••••')).toHaveLength(1);
    });

    it('reveals username only credential', () => {
        render(<CredentialCell username="alice" password={null} />);
        fireEvent.click(screen.getByRole('button', { name: 'Show credentials' }));
        expect(screen.getByText('alice')).toBeInTheDocument();
    });

    // --- Password only ---

    it('renders password only when username is null', () => {
        render(<CredentialCell username={null} password="secret" />);
        expect(screen.getByText('pass:')).toBeInTheDocument();
        expect(screen.queryByText('user:')).not.toBeInTheDocument();
        expect(screen.getAllByText('••••••••')).toHaveLength(1);
    });

    it('reveals password only credential', () => {
        render(<CredentialCell username={null} password="secret" />);
        fireEvent.click(screen.getByRole('button', { name: 'Show credentials' }));
        expect(screen.getByText('secret')).toBeInTheDocument();
    });
});
