import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LoginPage from '@/app/login/page';
import { login } from '@/lib/authService';
import { setToken } from '@/lib/auth';

// Mock the modules
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/authService', () => ({
  login: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  setToken: jest.fn(),
}));

describe('LoginPage', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('renders login form', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/email or username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
  });

  it('shows loading state when submitting', async () => {
    (login as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email or username/i), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText(/logging in/i)).toBeInTheDocument();
  });

  it('redirects to dashboard on successful login', async () => {
    (login as jest.Mock).mockResolvedValue({
      token: 'fake-token',
      username: 'testuser',
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email or username/i), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        identifier: 'testuser',
        password: 'password123',
      });
      expect(setToken).toHaveBeenCalledWith('fake-token');
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows error message on failed login', async () => {
    (login as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email or username/i), {
      target: { value: 'wronguser' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText(/login failed/i)).toBeInTheDocument();
  });

  it('has link to register page', () => {
    render(<LoginPage />);

    const registerLink = screen.getByRole('link', { name: /register/i });
    expect(registerLink).toHaveAttribute('href', '/register');
  });
});