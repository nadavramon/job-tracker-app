import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import RegisterPage from '@/app/(auth)/register/page';
import { register } from '@/lib/authService';
import { setToken } from '@/lib/auth';
import { ThemeProvider } from '@/context/ThemeContext';

// Mock the modules
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/authService', () => ({
  register: jest.fn(),
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

describe('RegisterPage', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('renders register form', () => {
    render(
      <ThemeProvider>
        <RegisterPage />
      </ThemeProvider>
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i, { selector: 'input' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
  });

  it('shows loading state when submitting', async () => {
    (register as jest.Mock).mockImplementation(() => new Promise(() => { }));

    render(
      <ThemeProvider>
        <RegisterPage />
      </ThemeProvider>
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@test.com' },
    });
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText(/password/i, { selector: 'input' }), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText(/creating account/i)).toBeInTheDocument();
  });

  it('redirects to dashboard on successful registration', async () => {
    (register as jest.Mock).mockResolvedValue({
      token: 'fake-token',
      username: 'testuser',
    });

    render(
      <ThemeProvider>
        <RegisterPage />
      </ThemeProvider>
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@test.com' },
    });
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText(/password/i, { selector: 'input' }), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith({
        email: 'test@test.com',
        username: 'testuser',
        password: 'password123',
      });
      expect(setToken).toHaveBeenCalledWith('fake-token');
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows mapped error message on failed registration', async () => {
    (register as jest.Mock).mockRejectedValue({
      response: { data: { message: 'Email or username already taken' } },
    });

    render(
      <ThemeProvider>
        <RegisterPage />
      </ThemeProvider>
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@test.com' },
    });
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText(/password/i, { selector: 'input' }), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText(/already registered/i)).toBeInTheDocument();
  });

  it('shows fallback error message for unexpected failures', async () => {
    (register as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(
      <ThemeProvider>
        <RegisterPage />
      </ThemeProvider>
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@test.com' },
    });
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText(/password/i, { selector: 'input' }), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('has link to login page', () => {
    render(
      <ThemeProvider>
        <RegisterPage />
      </ThemeProvider>
    );

    const loginLink = screen.getByRole('link', { name: /login/i });
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});