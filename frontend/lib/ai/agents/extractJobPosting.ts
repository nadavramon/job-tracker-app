import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod/v4';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { AI_CONFIG } from '../config';
import { ExtractJobPostingInput, ExtractJobPostingOutput } from '../types';

const ExtractionSchema = z.object({
    companyName: z.string().nullable(),
    jobRole: z.string().nullable(),
    location: z.string().nullable(),
    jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']).nullable(),
    websiteLink: z.string().nullable(),
});

const SYSTEM_PROMPT = `You are a job posting data extractor. Extract structured information from job posting text.
Rules:
- If a field cannot be determined, set it to null.
- For jobType: full-time/permanent → FULL_TIME, part-time → PART_TIME, contract/freelance → CONTRACT, internship/co-op → INTERNSHIP.
- For websiteLink: extract the careers/application URL if present, otherwise null.
- For location: include city and state/country. If remote, include "Remote".`;

export async function extractJobPosting(
    client: Anthropic,
    input: ExtractJobPostingInput,
): Promise<ExtractJobPostingOutput> {
    const userMessage = input.sourceUrl
        ? `Source URL: ${input.sourceUrl}\n\nJob posting text:\n${input.text}`
        : input.text;

    const response = await client.messages.parse({
        model: AI_CONFIG.model,
        max_tokens: AI_CONFIG.maxTokens.extract,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
        output_config: { format: zodOutputFormat(ExtractionSchema) },
    });

    return response.parsed_output as ExtractJobPostingOutput;
}
