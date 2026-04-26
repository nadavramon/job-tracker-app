import { render, screen, fireEvent } from '@testing-library/react';
import RowActionMenu from '@/components/applications/RowActionMenu';

const defaultProps = {
    websiteLink: 'https://example.com',
    onEdit: jest.fn(),
    onDelete: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe('RowActionMenu', () => {
    // --- Closed state ---

    it('renders the kebab button', () => {
        render(<RowActionMenu {...defaultProps} />);
        expect(screen.getByRole('button', { name: 'Row actions' })).toBeInTheDocument();
    });

    it('does not show the dropdown initially', () => {
        render(<RowActionMenu {...defaultProps} />);
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('has aria-expanded=false initially', () => {
        render(<RowActionMenu {...defaultProps} />);
        expect(screen.getByRole('button', { name: 'Row actions' })).toHaveAttribute('aria-expanded', 'false');
    });

    // --- Opening ---

    it('opens the dropdown when the kebab button is clicked', () => {
        render(<RowActionMenu {...defaultProps} />);
        fireEvent.click(screen.getByRole('button', { name: 'Row actions' }));
        expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('shows Edit, Open Website, and Delete menu items when open', () => {
        render(<RowActionMenu {...defaultProps} />);
        fireEvent.click(screen.getByRole('button', { name: 'Row actions' }));
        expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'Open Website' })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
    });

    it('sets aria-expanded=true when open', () => {
        render(<RowActionMenu {...defaultProps} />);
        fireEvent.click(screen.getByRole('button', { name: 'Row actions' }));
        expect(screen.getByRole('button', { name: 'Row actions' })).toHaveAttribute('aria-expanded', 'true');
    });

    // --- Closing ---

    it('closes when the kebab button is clicked again', () => {
        render(<RowActionMenu {...defaultProps} />);
        fireEvent.click(screen.getByRole('button', { name: 'Row actions' }));
        fireEvent.click(screen.getByRole('button', { name: 'Row actions' }));
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('closes on Escape key', () => {
        render(<RowActionMenu {...defaultProps} />);
        fireEvent.click(screen.getByRole('button', { name: 'Row actions' }));
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('closes on outside mousedown', () => {
        render(<RowActionMenu {...defaultProps} />);
        fireEvent.click(screen.getByRole('button', { name: 'Row actions' }));
        fireEvent.mouseDown(document.body);
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    // --- Edit ---

    it('calls onEdit and closes when Edit is clicked', () => {
        const onEdit = jest.fn();
        render(<RowActionMenu {...defaultProps} onEdit={onEdit} />);
        fireEvent.click(screen.getByRole('button', { name: 'Row actions' }));
        fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));
        expect(onEdit).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    // --- Delete ---

    it('calls onDelete and closes when Delete is clicked', () => {
        const onDelete = jest.fn();
        render(<RowActionMenu {...defaultProps} onDelete={onDelete} />);
        fireEvent.click(screen.getByRole('button', { name: 'Row actions' }));
        fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
        expect(onDelete).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    // --- Open Website ---

    it('opens website in a new tab and closes when Open Website is clicked', () => {
        const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
        render(<RowActionMenu {...defaultProps} websiteLink="https://example.com" />);
        fireEvent.click(screen.getByRole('button', { name: 'Row actions' }));
        fireEvent.click(screen.getByRole('menuitem', { name: 'Open Website' }));
        expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
        openSpy.mockRestore();
    });

    it('disables Open Website when websiteLink is null', () => {
        render(<RowActionMenu {...defaultProps} websiteLink={null} />);
        fireEvent.click(screen.getByRole('button', { name: 'Row actions' }));
        expect(screen.getByRole('menuitem', { name: 'Open Website' })).toBeDisabled();
    });

    it('does not call window.open when Open Website is disabled', () => {
        const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
        render(<RowActionMenu {...defaultProps} websiteLink={null} />);
        fireEvent.click(screen.getByRole('button', { name: 'Row actions' }));
        fireEvent.click(screen.getByRole('menuitem', { name: 'Open Website' }));
        expect(openSpy).not.toHaveBeenCalled();
        openSpy.mockRestore();
    });

    it('does not call window.open for non-http URLs', () => {
        const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
        render(<RowActionMenu {...defaultProps} websiteLink="javascript:alert(1)" />);
        fireEvent.click(screen.getByRole('button', { name: 'Row actions' }));
        fireEvent.click(screen.getByRole('menuitem', { name: 'Open Website' }));
        expect(openSpy).not.toHaveBeenCalled();
        openSpy.mockRestore();
    });

    it('opens http:// links', () => {
        const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
        render(<RowActionMenu {...defaultProps} websiteLink="http://example.com" />);
        fireEvent.click(screen.getByRole('button', { name: 'Row actions' }));
        fireEvent.click(screen.getByRole('menuitem', { name: 'Open Website' }));
        expect(openSpy).toHaveBeenCalledWith('http://example.com', '_blank', 'noopener,noreferrer');
        openSpy.mockRestore();
    });
});
