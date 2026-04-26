import { render, screen, act } from '@testing-library/react';
import { ToastProvider, useToast } from '@/context/ToastContext';

// Render portal content inline so screen queries can find it
jest.mock('react-dom', () => ({
    ...jest.requireActual('react-dom'),
    createPortal: (node: React.ReactNode) => node,
}));

function ToastConsumer() {
    const { toast } = useToast();
    return (
        <div>
            <button onClick={() => toast.success('Saved!')}>Success</button>
            <button onClick={() => toast.error('Failed!')}>Error</button>
            <button onClick={() => toast.info('Note!')}>Info</button>
            <button onClick={() => toast.warning('Careful!')}>Warning</button>
        </div>
    );
}

describe('ToastContext', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('shows a success toast when toast.success is called', () => {
        render(
            <ToastProvider>
                <ToastConsumer />
            </ToastProvider>
        );
        act(() => { screen.getByText('Success').click(); });
        expect(screen.getByText('Saved!')).toBeInTheDocument();
    });

    it('shows an error toast when toast.error is called', () => {
        render(
            <ToastProvider>
                <ToastConsumer />
            </ToastProvider>
        );
        act(() => { screen.getByText('Error').click(); });
        expect(screen.getByText('Failed!')).toBeInTheDocument();
    });

    it('auto-dismisses success toast after 3 seconds', () => {
        render(
            <ToastProvider>
                <ToastConsumer />
            </ToastProvider>
        );
        act(() => { screen.getByText('Success').click(); });
        expect(screen.getByText('Saved!')).toBeInTheDocument();

        act(() => { jest.advanceTimersByTime(3000); });
        expect(screen.queryByText('Saved!')).not.toBeInTheDocument();
    });

    it('keeps error toast visible at 3 seconds and dismisses it at 6 seconds', () => {
        render(
            <ToastProvider>
                <ToastConsumer />
            </ToastProvider>
        );
        act(() => { screen.getByText('Error').click(); });
        expect(screen.getByText('Failed!')).toBeInTheDocument();

        act(() => { jest.advanceTimersByTime(3000); });
        expect(screen.getByText('Failed!')).toBeInTheDocument();

        act(() => { jest.advanceTimersByTime(3000); });
        expect(screen.queryByText('Failed!')).not.toBeInTheDocument();
    });

    it('dismisses a toast manually when the close button is clicked', () => {
        render(
            <ToastProvider>
                <ToastConsumer />
            </ToastProvider>
        );
        act(() => { screen.getByText('Success').click(); });
        expect(screen.getByText('Saved!')).toBeInTheDocument();

        act(() => { screen.getByRole('button', { name: /close/i }).click(); });
        expect(screen.queryByText('Saved!')).not.toBeInTheDocument();
    });

    it('limits visible toasts to 5 when more than 5 are triggered', () => {
        render(
            <ToastProvider>
                <ToastConsumer />
            </ToastProvider>
        );
        for (let i = 0; i < 7; i++) {
            act(() => { screen.getByText('Success').click(); });
        }
        expect(screen.getAllByText('Saved!')).toHaveLength(5);
    });
});
