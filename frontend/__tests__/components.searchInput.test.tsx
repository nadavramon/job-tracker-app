import { render, screen, fireEvent, act } from '@testing-library/react';
import SearchInput from '@/components/ui/SearchInput';

describe('SearchInput', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('renders with initial value', () => {
        render(<SearchInput value="hello" onChange={jest.fn()} />);
        expect(screen.getByRole('searchbox')).toHaveValue('hello');
    });

    it('renders with empty initial value', () => {
        render(<SearchInput value="" onChange={jest.fn()} />);
        expect(screen.getByRole('searchbox')).toHaveValue('');
    });

    it('uses provided placeholder', () => {
        render(<SearchInput value="" onChange={jest.fn()} placeholder="Find jobs…" />);
        expect(screen.getByPlaceholderText('Find jobs…')).toBeInTheDocument();
    });

    it('does not show clear button when value is empty', () => {
        render(<SearchInput value="" onChange={jest.fn()} />);
        expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument();
    });

    it('shows clear button when input has a value', () => {
        render(<SearchInput value="react" onChange={jest.fn()} />);
        expect(screen.getByRole('button', { name: /clear search/i })).toBeInTheDocument();
    });

    it('clicking clear button clears the input immediately', () => {
        const onChange = jest.fn();
        render(<SearchInput value="react" onChange={onChange} />);
        fireEvent.click(screen.getByRole('button', { name: /clear search/i }));
        expect(screen.getByRole('searchbox')).toHaveValue('');
    });

    it('clicking clear button calls onChange("") immediately (not debounced)', () => {
        const onChange = jest.fn();
        render(<SearchInput value="react" onChange={onChange} />);
        fireEvent.click(screen.getByRole('button', { name: /clear search/i }));
        // onChange must be called right away, before any timer advances
        expect(onChange).toHaveBeenCalledWith('');
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('debounces onChange when typing (does not call before 300ms)', () => {
        const onChange = jest.fn();
        render(<SearchInput value="" onChange={onChange} />);
        fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'j' } });
        // onChange should NOT have been called yet
        expect(onChange).not.toHaveBeenCalled();
    });

    it('calls onChange after 300ms debounce', () => {
        const onChange = jest.fn();
        render(<SearchInput value="" onChange={onChange} />);
        fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'java' } });

        act(() => { jest.advanceTimersByTime(300); });

        expect(onChange).toHaveBeenCalledWith('java');
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('resets debounce timer on each keystroke (only fires once for rapid typing)', () => {
        const onChange = jest.fn();
        render(<SearchInput value="" onChange={onChange} />);

        fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'j' } });
        act(() => { jest.advanceTimersByTime(100); });
        fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'ja' } });
        act(() => { jest.advanceTimersByTime(100); });
        fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'java' } });

        // Not yet — still within debounce window
        expect(onChange).not.toHaveBeenCalled();

        act(() => { jest.advanceTimersByTime(300); });
        expect(onChange).toHaveBeenCalledWith('java');
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('syncs local value when parent resets value prop to empty string', () => {
        const { rerender } = render(<SearchInput value="react" onChange={jest.fn()} />);
        expect(screen.getByRole('searchbox')).toHaveValue('react');

        rerender(<SearchInput value="" onChange={jest.fn()} />);
        expect(screen.getByRole('searchbox')).toHaveValue('');
    });

    it('hides clear button after clearing', () => {
        const onChange = jest.fn();
        render(<SearchInput value="react" onChange={onChange} />);
        fireEvent.click(screen.getByRole('button', { name: /clear search/i }));
        expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument();
    });
});
