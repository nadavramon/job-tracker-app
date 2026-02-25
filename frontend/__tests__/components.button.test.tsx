import { render, screen, fireEvent } from '@testing-library/react';
import Button from '@/components/ui/Button';

describe('Button', () => {
    it('renders children', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('applies primary variant classes by default', () => {
        render(<Button variant="primary">Primary</Button>);
        const btn = screen.getByRole('button', { name: 'Primary' });
        expect(btn.className).toContain('bg-[var(--primary)]');
    });

    it('applies secondary variant classes', () => {
        render(<Button variant="secondary">Secondary</Button>);
        const btn = screen.getByRole('button', { name: 'Secondary' });
        expect(btn.className).toContain('bg-[var(--muted)]');
    });

    it('applies destructive variant classes', () => {
        render(<Button variant="destructive">Delete</Button>);
        const btn = screen.getByRole('button', { name: 'Delete' });
        expect(btn.className).toContain('bg-[var(--destructive)]');
    });

    it('shows Spinner when loading={true} and button is disabled', () => {
        render(<Button loading>Saving</Button>);
        const btn = screen.getByRole('button', { name: /saving/i });
        expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
        expect(btn).toBeDisabled();
    });

    it('is disabled when disabled={true}', () => {
        render(<Button disabled>Disabled</Button>);
        expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled();
    });

    it('calls onClick when clicked', () => {
        const handleClick = jest.fn();
        render(<Button onClick={handleClick}>Press</Button>);
        fireEvent.click(screen.getByRole('button', { name: 'Press' }));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
        const handleClick = jest.fn();
        render(<Button onClick={handleClick} disabled>Disabled</Button>);
        fireEvent.click(screen.getByRole('button', { name: 'Disabled' }));
        expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', () => {
        const handleClick = jest.fn();
        render(<Button onClick={handleClick} loading>Loading</Button>);
        fireEvent.click(screen.getByRole('button', { name: /loading/i }));
        expect(handleClick).not.toHaveBeenCalled();
    });
});
