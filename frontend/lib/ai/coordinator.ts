import Anthropic from '@anthropic-ai/sdk';
import { AiResponse } from './types';

type AgentFn<TInput, TOutput> = (client: Anthropic, input: TInput) => Promise<TOutput>;

export async function runAgent<TInput, TOutput>(
    agentFn: AgentFn<TInput, TOutput>,
    input: TInput,
): Promise<AiResponse<TOutput>> {
    const client = new Anthropic();

    try {
        const data = await agentFn(client, input);
        return { success: true, data };
    } catch (error) {
        if (error instanceof SyntaxError) {
            return {
                success: false,
                error: 'EXTRACTION_FAILED',
                message: 'Failed to parse AI response.',
            };
        }

        if (error instanceof Anthropic.APIError) {
            if (error.status === 429) {
                return {
                    success: false,
                    error: 'RATE_LIMITED',
                    message: 'AI service is rate limited. Please try again shortly.',
                };
            }
            return {
                success: false,
                error: 'AI_UNAVAILABLE',
                message: 'AI service is temporarily unavailable.',
            };
        }

        return {
            success: false,
            error: 'AI_UNAVAILABLE',
            message: 'An unexpected error occurred.',
        };
    }
}
