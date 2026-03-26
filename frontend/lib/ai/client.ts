import Anthropic from '@anthropic-ai/sdk';

export function getClient(apiKey: string): Anthropic {
    return new Anthropic({ apiKey });
}
