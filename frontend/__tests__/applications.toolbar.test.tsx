import { render, screen, fireEvent } from '@testing-library/react';
import ApplicationsToolbar from '@/components/applications/ApplicationsToolbar';

const defaultProps = {
    search: '',
    onSearchChange: jest.fn(),
    statusFilter: '' as const,
    onStatusFilterChange: jest.fn(),
    sortDir: 'desc' as const,
    onSortToggle: jest.fn(),
};

describe('ApplicationsToolbar', () => {
    beforeEach(() => jest.clearAllMocks());

    it('renders search input, status filter, and sort button', () => {
        render(<ApplicationsToolbar {...defaultProps} />);
        expect(screen.getByRole('searchbox')).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: /filter by status/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sort by applied date/i })).toBeInTheDocument();
    });

    it('renders all status options plus "All Statuses"', () => {
        render(<ApplicationsToolbar {...defaultProps} />);
        const select = screen.getByRole('combobox', { name: /filter by status/i });
        const options = select.querySelectorAll('option');
        expect(options).toHaveLength(7); // All Statuses + 6 statuses
        expect(options[0]).toHaveTextContent('All Statuses');
    });

    it('calls onStatusFilterChange when status select changes', () => {
        render(<ApplicationsToolbar {...defaultProps} />);
        fireEvent.change(screen.getByRole('combobox', { name: /filter by status/i }), {
            target: { value: 'OFFER' },
        });
        expect(defaultProps.onStatusFilterChange).toHaveBeenCalledTimes(1);
    });

    it('calls onSortToggle when sort button is clicked', () => {
        render(<ApplicationsToolbar {...defaultProps} />);
        fireEvent.click(screen.getByRole('button', { name: /sort by applied date/i }));
        expect(defaultProps.onSortToggle).toHaveBeenCalledTimes(1);
    });

    it('shows descending arrow when sortDir is desc', () => {
        render(<ApplicationsToolbar {...defaultProps} sortDir="desc" />);
        expect(screen.getByRole('button', { name: /sort by applied date/i })).toHaveTextContent('Applied Date ↓');
    });

    it('shows ascending arrow when sortDir is asc', () => {
        render(<ApplicationsToolbar {...defaultProps} sortDir="asc" />);
        expect(screen.getByRole('button', { name: /sort by applied date/i })).toHaveTextContent('Applied Date ↑');
    });

    it('reflects the current search value', () => {
        render(<ApplicationsToolbar {...defaultProps} search="Google" />);
        expect(screen.getByRole('searchbox')).toHaveValue('Google');
    });

    it('reflects the current status filter value', () => {
        render(<ApplicationsToolbar {...defaultProps} statusFilter="REJECTED" />);
        expect(screen.getByRole('combobox', { name: /filter by status/i })).toHaveValue('REJECTED');
    });
});
