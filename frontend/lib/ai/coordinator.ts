import Anthropic from '@anthropic-ai/sdk';
import { getClient } from './client';
import { AiResponse } from './types';

type AgentFn<TInput, TOutput> = (client: Anthropic, input: TInput) => Promise<TOutput>;

export async function runAgent<TInput, TOutput>(
    agentFn: AgentFn<TInput, TOutput>,
    input: TInput,
): Promise<AiResponse<TOutput>> {
    const client = getClient();

    try {
        const data = await agentFn(client, input);
        return { success: true, data };
    } catch (error) {
        if (error instanceof Anthropic.APIError) {
            if (error.status === 401) {
                return {
                    success: false,
                    error: 'AUTH_ERROR',
                    message: 'AI service configuration error. Contact administrator.',
                };
            }
            if (error.status === 429) {
                return {
                    success: false,
                    error: 'RATE_LIMITED',
                    message: 'AI service is rate limited. Please try again shortly.',
                };
            }
            if (error.status === 400) {
                return {
                    success: false,
                    error: 'AI_UNAVAILABLE',
                    message: 'AI service is temporarily unavailable.',
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
