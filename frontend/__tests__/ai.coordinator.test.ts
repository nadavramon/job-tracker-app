import Anthropic from '@anthropic-ai/sdk';
import { runAgent } from '@/lib/ai/coordinator';

jest.mock('@anthropic-ai/sdk', () => {
    const APIError = class extends Error {
        status: number;
        constructor(status: number, message: string) {
            super(message);
            this.status = status;
            this.name = 'APIError';
        }
    };
    const MockAnthropic = jest.fn(() => ({}));
    MockAnthropic.APIError = APIError;
    return {
        __esModule: true,
        default: MockAnthropic,
    };
});

describe('runAgent', () => {
    it('returns success when agent resolves', async () => {
        const agent = jest.fn().mockResolvedValue({ field: 'value' });

        const result = await runAgent(agent, { input: 'test' });

        expect(result).toEqual({ success: true, data: { field: 'value' } });
        expect(agent).toHaveBeenCalledWith(expect.any(Object), { input: 'test' });
    });

    it('returns EXTRACTION_FAILED on SyntaxError', async () => {
        const agent = jest.fn().mockRejectedValue(new SyntaxError('Unexpected token'));

        const result = await runAgent(agent, { input: 'test' });

        expect(result).toEqual({
            success: false,
            error: 'EXTRACTION_FAILED',
            message: 'Failed to parse AI response.',
        });
    });

    it('returns RATE_LIMITED on APIError 429', async () => {
        const error = new Anthropic.APIError(429, 'Rate limited');
        const agent = jest.fn().mockRejectedValue(error);

        const result = await runAgent(agent, { input: 'test' });

        expect(result).toEqual({
            success: false,
            error: 'RATE_LIMITED',
            message: 'AI service is rate limited. Please try again shortly.',
        });
    });

    it('returns AI_UNAVAILABLE on other APIError', async () => {
        const error = new Anthropic.APIError(500, 'Internal error');
        const agent = jest.fn().mockRejectedValue(error);

        const result = await runAgent(agent, { input: 'test' });

        expect(result).toEqual({
            success: false,
            error: 'AI_UNAVAILABLE',
            message: 'AI service is temporarily unavailable.',
        });
    });

    it('returns AI_UNAVAILABLE on generic error', async () => {
        const agent = jest.fn().mockRejectedValue(new Error('network failure'));

        const result = await runAgent(agent, { input: 'test' });

        expect(result).toEqual({
            success: false,
            error: 'AI_UNAVAILABLE',
            message: 'An unexpected error occurred.',
        });
    });
});
