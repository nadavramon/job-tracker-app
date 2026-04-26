import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import JobExtractor from '@/components/applications/JobExtractor';
import { extractJobPosting } from '@/lib/aiService';

jest.mock('@/lib/aiService', () => ({
    extractJobPosting: jest.fn(),
}));

const mockToast = { success: jest.fn(), error: jest.fn(), info: jest.fn(), warning: jest.fn() };
jest.mock('@/context/ToastContext', () => ({
    useToast: () => ({ toast: mockToast }),
}));

const mockExtract = extractJobPosting as jest.Mock;

function makeOutput(overrides = {}) {
    return {
        companyName: 'Acme Corp',
        jobRole: 'Software Engineer',
        location: 'Remote',
        jobType: 'FULL_TIME' as const,
        websiteLink: 'https://acme.com/careers',
        ...overrides,
    };
}

describe('JobExtractor', () => {
    const onExtracted = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders textarea and button', () => {
        render(<JobExtractor onExtracted={onExtracted} />);

        expect(screen.getByPlaceholderText(/paste a job posting/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /extract details/i })).toBeInTheDocument();
    });

    it('disables button when textarea is empty', () => {
        render(<JobExtractor onExtracted={onExtracted} />);

        expect(screen.getByRole('button', { name: /extract details/i })).toBeDisabled();
    });

    it('enables button when textarea has text', () => {
        render(<JobExtractor onExtracted={onExtracted} />);

        fireEvent.change(screen.getByPlaceholderText(/paste a job posting/i), {
            target: { value: 'Some job posting text' },
        });

        expect(screen.getByRole('button', { name: /extract details/i })).toBeEnabled();
    });

    it('calls onExtracted on successful extraction', async () => {
        const output = makeOutput();
        mockExtract.mockResolvedValueOnce(output);

        render(<JobExtractor onExtracted={onExtracted} />);

        fireEvent.change(screen.getByPlaceholderText(/paste a job posting/i), {
            target: { value: 'Software Engineer at Acme Corp' },
        });
        fireEvent.click(screen.getByRole('button', { name: /extract details/i }));

        await waitFor(() => {
            expect(onExtracted).toHaveBeenCalledWith(output);
        });

        expect(mockExtract).toHaveBeenCalledWith('Software Engineer at Acme Corp');
    });

    it('shows toast error on failure', async () => {
        mockExtract.mockRejectedValueOnce(new Error('AI service is temporarily unavailable.'));

        render(<JobExtractor onExtracted={onExtracted} />);

        fireEvent.change(screen.getByPlaceholderText(/paste a job posting/i), {
            target: { value: 'Some text' },
        });
        fireEvent.click(screen.getByRole('button', { name: /extract details/i }));

        await waitFor(() => {
            expect(mockToast.error).toHaveBeenCalled();
        });

        expect(onExtracted).not.toHaveBeenCalled();
    });

    it('shows loading state during extraction', async () => {
        let resolveExtract!: (value: unknown) => void;
        mockExtract.mockReturnValueOnce(
            new Promise((resolve) => {
                resolveExtract = resolve;
            }),
        );

        render(<JobExtractor onExtracted={onExtracted} />);

        fireEvent.change(screen.getByPlaceholderText(/paste a job posting/i), {
            target: { value: 'Some text' },
        });
        fireEvent.click(screen.getByRole('button', { name: /extract details/i }));

        expect(screen.getByRole('button', { name: /extract details/i })).toBeDisabled();

        resolveExtract(makeOutput());

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /extract details/i })).toBeEnabled();
        });
    });
});
