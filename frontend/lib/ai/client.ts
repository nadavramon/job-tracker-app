import Anthropic from '@anthropic-ai/sdk';

let _client: Anthropic | null = null;

export function getClient(): Anthropic {
    if (!_client) {
        _client = new Anthropic();
    }
    return _client;
}
