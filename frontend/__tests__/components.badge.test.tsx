import { render, screen } from '@testing-library/react';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import { Status } from '@/types';

describe('Badge', () => {
    it('renders children', () => {
        render(<Badge>Hello</Badge>);
        expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    it('applies default variant class by default', () => {
        render(<Badge>Default</Badge>);
        const badge = screen.getByText('Default');
        expect(badge.className).toContain('bg-blue-100');
        expect(badge.className).toContain('text-blue-800');
    });

    it('applies success variant classes', () => {
        render(<Badge variant="success">Success</Badge>);
        const badge = screen.getByText('Success');
        expect(badge.className).toContain('bg-green-100');
        expect(badge.className).toContain('text-green-800');
    });

    it('applies warning variant classes', () => {
        render(<Badge variant="warning">Warning</Badge>);
        const badge = screen.getByText('Warning');
        expect(badge.className).toContain('bg-amber-100');
        expect(badge.className).toContain('text-amber-800');
    });

    it('applies danger variant classes', () => {
        render(<Badge variant="danger">Danger</Badge>);
        const badge = screen.getByText('Danger');
        expect(badge.className).toContain('bg-red-100');
        expect(badge.className).toContain('text-red-800');
    });

    it('applies info variant classes', () => {
        render(<Badge variant="info">Info</Badge>);
        const badge = screen.getByText('Info');
        expect(badge.className).toContain('bg-purple-100');
        expect(badge.className).toContain('text-purple-800');
    });

    it('applies muted variant classes', () => {
        render(<Badge variant="muted">Muted</Badge>);
        const badge = screen.getByText('Muted');
        expect(badge.className).toContain('bg-[var(--muted)]');
        expect(badge.className).toContain('text-[var(--muted-foreground)]');
    });

    it('merges extra className onto the span', () => {
        render(<Badge className="extra-class">Custom</Badge>);
        expect(screen.getByText('Custom').className).toContain('extra-class');
    });
});

describe('StatusBadge', () => {
    const cases: { status: Status; label: string }[] = [
        { status: 'APPLIED',      label: 'Applied' },
        { status: 'SCREENING',    label: 'Screening' },
        { status: 'INTERVIEWING', label: 'Interviewing' },
        { status: 'OFFER',        label: 'Offer' },
        { status: 'REJECTED',     label: 'Rejected' },
        { status: 'WITHDRAWN',    label: 'Withdrawn' },
    ];

    it.each(cases)('renders correct label for status $status', ({ status, label }) => {
        render(<StatusBadge status={status} />);
        expect(screen.getByText(label)).toBeInTheDocument();
    });

    it('APPLIED maps to default (blue) variant', () => {
        render(<StatusBadge status="APPLIED" />);
        expect(screen.getByText('Applied').className).toContain('bg-blue-100');
    });

    it('SCREENING maps to info (purple) variant', () => {
        render(<StatusBadge status="SCREENING" />);
        expect(screen.getByText('Screening').className).toContain('bg-purple-100');
    });

    it('INTERVIEWING maps to warning (amber) variant', () => {
        render(<StatusBadge status="INTERVIEWING" />);
        expect(screen.getByText('Interviewing').className).toContain('bg-amber-100');
    });

    it('OFFER maps to success (green) variant', () => {
        render(<StatusBadge status="OFFER" />);
        expect(screen.getByText('Offer').className).toContain('bg-green-100');
    });

    it('REJECTED maps to danger (red) variant', () => {
        render(<StatusBadge status="REJECTED" />);
        expect(screen.getByText('Rejected').className).toContain('bg-red-100');
    });

    it('WITHDRAWN maps to muted variant', () => {
        render(<StatusBadge status="WITHDRAWN" />);
        expect(screen.getByText('Withdrawn').className).toContain('bg-[var(--muted)]');
    });
});
