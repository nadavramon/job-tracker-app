import { render, screen, fireEvent } from '@testing-library/react';
import ApplicationsFooter from '@/components/applications/ApplicationsFooter';

const defaultProps = {
    pageSize: 20,
    onPageSizeChange: jest.fn(),
    page: 0,
    totalPages: 1,
    totalElements: 5,
    currentPageSize: 20,
    onPageChange: jest.fn(),
};

describe('ApplicationsFooter', () => {
    beforeEach(() => jest.clearAllMocks());

    it('renders rows-per-page selector with correct value', () => {
        render(<ApplicationsFooter {...defaultProps} />);
        const select = screen.getByRole('combobox', { name: /rows per page/i });
        expect(select).toBeInTheDocument();
        expect(select).toHaveValue('20');
    });

    it('renders all page size options', () => {
        render(<ApplicationsFooter {...defaultProps} />);
        const options = screen.getByRole('combobox', { name: /rows per page/i }).querySelectorAll('option');
        expect(options).toHaveLength(3);
        expect(options[0]).toHaveValue('10');
        expect(options[1]).toHaveValue('20');
        expect(options[2]).toHaveValue('50');
    });

    it('calls onPageSizeChange when select changes', () => {
        render(<ApplicationsFooter {...defaultProps} />);
        fireEvent.change(screen.getByRole('combobox', { name: /rows per page/i }), {
            target: { value: '50' },
        });
        expect(defaultProps.onPageSizeChange).toHaveBeenCalledTimes(1);
    });

    it('renders pagination when totalPages > 1', () => {
        render(<ApplicationsFooter {...defaultProps} totalPages={3} totalElements={60} />);
        expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();
    });

    it('does not render pagination when totalPages <= 1', () => {
        render(<ApplicationsFooter {...defaultProps} totalPages={1} />);
        expect(screen.queryByRole('button', { name: /next page/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /previous page/i })).not.toBeInTheDocument();
    });

    it('reflects the current pageSize value', () => {
        render(<ApplicationsFooter {...defaultProps} pageSize={10} />);
        expect(screen.getByRole('combobox', { name: /rows per page/i })).toHaveValue('10');
    });
});
