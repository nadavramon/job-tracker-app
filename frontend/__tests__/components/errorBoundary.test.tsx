import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
    if (shouldThrow) throw new Error('boom');
    return <p>Content rendered</p>;
}

// Suppress React error boundary console noise during tests
beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
    jest.restoreAllMocks();
});

describe('ErrorBoundary', () => {
    it('renders children when no error occurs', () => {
        render(
            <ErrorBoundary>
                <p>Hello</p>
            </ErrorBoundary>,
        );
        expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    it('shows fallback UI when a child throws', () => {
        render(
            <ErrorBoundary>
                <ThrowingChild shouldThrow />
            </ErrorBoundary>,
        );
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
        expect(screen.queryByText('Content rendered')).not.toBeInTheDocument();
    });

    it('recovers when "Try again" is clicked and child no longer throws', () => {
        const { rerender } = render(
            <ErrorBoundary>
                <ThrowingChild shouldThrow />
            </ErrorBoundary>,
        );
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();

        // Rerender with a non-throwing child so recovery succeeds
        rerender(
            <ErrorBoundary>
                <ThrowingChild shouldThrow={false} />
            </ErrorBoundary>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
        expect(screen.getByText('Content rendered')).toBeInTheDocument();
        expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('renders custom fallback when provided', () => {
        render(
            <ErrorBoundary fallback={<p>Custom fallback</p>}>
                <ThrowingChild shouldThrow />
            </ErrorBoundary>,
        );
        expect(screen.getByText('Custom fallback')).toBeInTheDocument();
    });
});
