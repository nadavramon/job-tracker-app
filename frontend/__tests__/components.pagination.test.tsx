import { render, screen, fireEvent } from '@testing-library/react';
import Pagination from '@/components/ui/Pagination';

const defaultProps = {
    page: 0,
    totalPages: 5,
    totalElements: 100,
    pageSize: 20,
    onPageChange: jest.fn(),
};

describe('Pagination', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns null when totalPages <= 1', () => {
        const { container } = render(
            <Pagination
                page={0}
                totalPages={1}
                totalElements={5}
                pageSize={20}
                onPageChange={jest.fn()}
            />
        );
        expect(container.firstChild).toBeNull();
    });

    it('returns null when totalPages is 0', () => {
        const { container } = render(
            <Pagination
                page={0}
                totalPages={0}
                totalElements={0}
                pageSize={20}
                onPageChange={jest.fn()}
            />
        );
        expect(container.firstChild).toBeNull();
    });

    it('shows correct "Showing X–Y of Z" label on first page', () => {
        render(<Pagination {...defaultProps} page={0} />);
        // page 0, pageSize 20, totalElements 100 → "1–20 of 100"
        expect(screen.getByText('1–20')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('shows correct "Showing X–Y of Z" label on second page', () => {
        render(<Pagination {...defaultProps} page={1} />);
        // page 1, pageSize 20, totalElements 100 → "21–40 of 100"
        expect(screen.getByText('21–40')).toBeInTheDocument();
    });

    it('clamps "to" to totalElements on the last partial page', () => {
        render(
            <Pagination
                page={1}
                totalPages={2}
                totalElements={25}
                pageSize={20}
                onPageChange={jest.fn()}
            />
        );
        // page 1, pageSize 20, totalElements 25 → "21–25 of 25"
        expect(screen.getByText('21–25')).toBeInTheDocument();
    });

    it('calls onPageChange with correct page when a page button is clicked', () => {
        const onPageChange = jest.fn();
        render(<Pagination {...defaultProps} page={0} onPageChange={onPageChange} />);
        // Click "Page 2" button (0-based page 1)
        fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));
        expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it('calls onPageChange with page - 1 when previous button is clicked', () => {
        const onPageChange = jest.fn();
        render(<Pagination {...defaultProps} page={2} onPageChange={onPageChange} />);
        fireEvent.click(screen.getByRole('button', { name: 'Previous page' }));
        expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it('calls onPageChange with page + 1 when next button is clicked', () => {
        const onPageChange = jest.fn();
        render(<Pagination {...defaultProps} page={2} onPageChange={onPageChange} />);
        fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
        expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('previous button is disabled on the first page', () => {
        render(<Pagination {...defaultProps} page={0} />);
        expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    });

    it('next button is disabled on the last page', () => {
        render(<Pagination {...defaultProps} page={4} />);
        expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    });

    it('previous button is enabled when not on the first page', () => {
        render(<Pagination {...defaultProps} page={2} />);
        expect(screen.getByRole('button', { name: 'Previous page' })).not.toBeDisabled();
    });

    it('next button is enabled when not on the last page', () => {
        render(<Pagination {...defaultProps} page={2} />);
        expect(screen.getByRole('button', { name: 'Next page' })).not.toBeDisabled();
    });

    it('marks the current page button with aria-current="page"', () => {
        render(<Pagination {...defaultProps} page={2} />);
        expect(screen.getByRole('button', { name: 'Page 3' })).toHaveAttribute('aria-current', 'page');
    });
});
