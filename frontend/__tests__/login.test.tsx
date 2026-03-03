import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LoginPage from '@/app/(auth)/login/page';
import { login } from '@/lib/authService';
import { setToken } from '@/lib/auth';
import { ThemeProvider } from '@/context/ThemeContext';

// Mock the modules
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

jest.mock('@/lib/authService', () => ({
  login: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  setToken: jest.fn(),
  setUsername: jest.fn(),
  getToken: jest.fn().mockReturnValue(null),
}));

Object.defineProperty(window, 'matchMedia', {
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })),
});

describe('LoginPage', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('renders login form', () => {
    render(
      <ThemeProvider>
        <LoginPage />
      </ThemeProvider>
    );

    expect(screen.getByLabelText(/email or username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i, { selector: 'input' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
  });

  it('shows loading state when submitting', async () => {
    (login as jest.Mock).mockImplementation(() => new Promise(() => { })); // Never resolves

    render(
      <ThemeProvider>
        <LoginPage />
      </ThemeProvider>
    );

    fireEvent.change(screen.getByLabelText(/email or username/i), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText(/password/i, { selector: 'input' }), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/signing in/i)).toBeInTheDocument();
  });

  it('redirects to dashboard on successful login', async () => {
    (login as jest.Mock).mockResolvedValue({
      token: 'fake-token',
      username: 'testuser',
    });

    render(
      <ThemeProvider>
        <LoginPage />
      </ThemeProvider>
    );

    fireEvent.change(screen.getByLabelText(/email or username/i), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText(/password/i, { selector: 'input' }), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        identifier: 'testuser',
        password: 'password123',
      });
      expect(setToken).toHaveBeenCalledWith('fake-token');
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows mapped error message on failed login', async () => {
    (login as jest.Mock).mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });

    render(
      <ThemeProvider>
        <LoginPage />
      </ThemeProvider>
    );

    fireEvent.change(screen.getByLabelText(/email or username/i), {
      target: { value: 'wronguser' },
    });
    fireEvent.change(screen.getByLabelText(/password/i, { selector: 'input' }), {
      target: { value: 'wrongpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/invalid email\/username or password/i)).toBeInTheDocument();
  });

  it('shows fallback error message for unexpected failures', async () => {
    (login as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(
      <ThemeProvider>
        <LoginPage />
      </ThemeProvider>
    );

    fireEvent.change(screen.getByLabelText(/email or username/i), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText(/password/i, { selector: 'input' }), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('has link to register page', () => {
    render(
      <ThemeProvider>
        <LoginPage />
      </ThemeProvider>
    );

    const registerLink = screen.getByRole('link', { name: /create one/i });
    expect(registerLink).toHaveAttribute('href', '/register');
  });
});