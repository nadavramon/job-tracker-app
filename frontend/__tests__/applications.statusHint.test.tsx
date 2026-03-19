import { render, screen } from '@testing-library/react';
import StatusHint from '@/components/applications/StatusHint';

const FIXED_TODAY = '2026-03-04';

function dateMinusDays(days: number): string {
    const d = new Date(FIXED_TODAY);
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
}

beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(FIXED_TODAY));
});

afterAll(() => {
    jest.useRealTimers();
});

describe('StatusHint', () => {
    // --- Non-APPLIED statuses ---

    it.each(['SCREENING', 'INTERVIEWING', 'OFFER', 'REJECTED', 'WITHDRAWN'] as const)(
        'renders nothing for status %s',
        (status) => {
            const { container } = render(
                <StatusHint status={status} appliedDate={dateMinusDays(40)} />,
            );
            expect(container.firstChild).toBeNull();
        },
    );

    // --- Green: APPLIED within 14 days ---

    it('renders green dot when APPLIED 0 days ago', () => {
        render(<StatusHint status="APPLIED" appliedDate={dateMinusDays(0)} />);
        const dot = screen.getByRole('img', { name: /0 days ago — recently submitted/i });
        expect(dot).toBeInTheDocument();
        expect(dot).toHaveClass('bg-[var(--success)]');
    });

    it('renders green dot when APPLIED 13 days ago', () => {
        render(<StatusHint status="APPLIED" appliedDate={dateMinusDays(13)} />);
        const dot = screen.getByRole('img', { name: /13 days ago — recently submitted/i });
        expect(dot).toBeInTheDocument();
        expect(dot).toHaveClass('bg-[var(--success)]');
    });

    it('green dot has correct tooltip text', () => {
        render(<StatusHint status="APPLIED" appliedDate={dateMinusDays(5)} />);
        const dot = screen.getByRole('img');
        expect(dot).toHaveAttribute('title', 'Applied 5 days ago — recently submitted');
    });

    // --- Amber: 14–29 days ---

    it('renders amber dot when APPLIED 14 days ago', () => {
        render(<StatusHint status="APPLIED" appliedDate={dateMinusDays(14)} />);
        const dot = screen.getByRole('img', { name: /14 days ago — consider following up/i });
        expect(dot).toBeInTheDocument();
        expect(dot).toHaveClass('bg-[var(--warning)]');
    });

    it('renders amber dot when APPLIED 29 days ago', () => {
        render(<StatusHint status="APPLIED" appliedDate={dateMinusDays(29)} />);
        const dot = screen.getByRole('img', { name: /29 days ago — consider following up/i });
        expect(dot).toBeInTheDocument();
        expect(dot).toHaveClass('bg-[var(--warning)]');
    });

    it('amber dot has correct tooltip text', () => {
        render(<StatusHint status="APPLIED" appliedDate={dateMinusDays(20)} />);
        const dot = screen.getByRole('img');
        expect(dot).toHaveAttribute('title', 'Applied 20 days ago — consider following up');
    });

    // --- Red: 30+ days ---

    it('renders red dot when APPLIED 30 days ago', () => {
        render(<StatusHint status="APPLIED" appliedDate={dateMinusDays(30)} />);
        const dot = screen.getByRole('img', { name: /30 days ago — may be ghosted/i });
        expect(dot).toBeInTheDocument();
        expect(dot).toHaveClass('bg-[var(--status-rejected)]');
    });

    it('renders red dot when APPLIED 60 days ago', () => {
        render(<StatusHint status="APPLIED" appliedDate={dateMinusDays(60)} />);
        const dot = screen.getByRole('img', { name: /60 days ago — may be ghosted/i });
        expect(dot).toBeInTheDocument();
        expect(dot).toHaveClass('bg-[var(--status-rejected)]');
    });

    it('red dot has correct tooltip text', () => {
        render(<StatusHint status="APPLIED" appliedDate={dateMinusDays(45)} />);
        const dot = screen.getByRole('img');
        expect(dot).toHaveAttribute('title', 'Applied 45 days ago — may be ghosted');
    });

    it('does not show amber dot when 30+ days (only red)', () => {
        render(<StatusHint status="APPLIED" appliedDate={dateMinusDays(30)} />);
        const dots = screen.getAllByRole('img');
        expect(dots).toHaveLength(1);
        expect(dots[0]).toHaveClass('bg-[var(--status-rejected)]');
        expect(dots[0]).not.toHaveClass('bg-[var(--warning)]');
    });
});
