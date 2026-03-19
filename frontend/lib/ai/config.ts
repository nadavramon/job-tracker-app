export const AI_CONFIG = {
    model: 'claude-sonnet-4-20250514',
    maxTokens: {
        extract: 512,
        analyze: 1024,
        draft: 1024,
        prep: 2048,
    },
} as const;
