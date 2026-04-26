import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '@/components/ui/Modal';

// Render portal content inline so screen queries can find it
jest.mock('react-dom', () => ({
    ...jest.requireActual('react-dom'),
    createPortal: (node: React.ReactNode) => node,
}));

describe('Modal', () => {
    it('does not render when open={false}', () => {
        render(
            <Modal open={false} onClose={jest.fn()} title="My Modal">
                <p>Modal content</p>
            </Modal>
        );
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(screen.queryByText('My Modal')).not.toBeInTheDocument();
        expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
    });

    it('renders title and children when open={true}', () => {
        render(
            <Modal open={true} onClose={jest.fn()} title="My Modal">
                <p>Modal content</p>
            </Modal>
        );
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('My Modal')).toBeInTheDocument();
        expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('calls onClose when backdrop is clicked', () => {
        const onClose = jest.fn();
        render(
            <Modal open={true} onClose={onClose} title="My Modal">
                <p>Content</p>
            </Modal>
        );
        // The backdrop is the aria-hidden div; click on dialog container outside panel
        const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement;
        fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key is pressed', () => {
        const onClose = jest.fn();
        render(
            <Modal open={true} onClose={onClose} title="My Modal">
                <p>Content</p>
            </Modal>
        );
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose on Escape when closed', () => {
        const onClose = jest.fn();
        render(
            <Modal open={false} onClose={onClose} title="My Modal">
                <p>Content</p>
            </Modal>
        );
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onClose).not.toHaveBeenCalled();
    });

    it('close button calls onClose', () => {
        const onClose = jest.fn();
        render(
            <Modal open={true} onClose={onClose} title="My Modal">
                <p>Content</p>
            </Modal>
        );
        fireEvent.click(screen.getByRole('button', { name: /close/i }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('multiple instances each get unique title ids (no duplicate DOM ids)', () => {
        render(
            <>
                <Modal open={true} onClose={jest.fn()} title="First">
                    <p>First body</p>
                </Modal>
                <Modal open={true} onClose={jest.fn()} title="Second">
                    <p>Second body</p>
                </Modal>
            </>
        );
        const headings = screen.getAllByRole('heading');
        const ids = headings.map((h) => h.id).filter(Boolean);
        // Each heading should have a unique id
        const unique = new Set(ids);
        expect(unique.size).toBe(ids.length);
        expect(ids.length).toBeGreaterThanOrEqual(2);
    });
});
