import Anthropic from '@anthropic-ai/sdk';
import { AI_CONFIG } from '../config';
import { ExtractJobPostingInput, ExtractJobPostingOutput } from '../types';

const SYSTEM_PROMPT = `You are a job posting data extractor. Given the text of a job posting, extract structured information and return ONLY valid JSON with these fields:

{
  "companyName": string or null,
  "jobRole": string or null,
  "location": string or null,
  "jobType": "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | null,
  "websiteLink": string or null
}

Rules:
- Return ONLY the JSON object, no markdown fences, no explanation.
- If a field cannot be determined from the text, set it to null.
- For jobType, map to the closest match: full-time/permanent → "FULL_TIME", part-time → "PART_TIME", contract/freelance/temporary → "CONTRACT", internship/co-op → "INTERNSHIP". If unclear, set to null.
- For websiteLink, extract the company careers page or application URL if present. If only a company name is found, set to null.
- For location, include city and state/country if available. If "remote" is mentioned, include "Remote" in the location.`;

export async function extractJobPosting(
    client: Anthropic,
    input: ExtractJobPostingInput,
): Promise<ExtractJobPostingOutput> {
    const userMessage = input.sourceUrl
        ? `Source URL: ${input.sourceUrl}\n\nJob posting text:\n${input.text}`
        : input.text;

    const response = await client.messages.create({
        model: AI_CONFIG.model,
        max_tokens: AI_CONFIG.maxTokens.extract,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
    });

    const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('');

    const parsed = JSON.parse(text);

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new SyntaxError('AI response is not an object.');
    }

    const VALID_JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'];
    const MAX_FIELD_LENGTH = 500;

    const str = (val: unknown): string | null => {
        if (val === null || val === undefined) return null;
        if (typeof val !== 'string') return null;
        return val.slice(0, MAX_FIELD_LENGTH);
    };

    return {
        companyName: str(parsed.companyName),
        jobRole: str(parsed.jobRole),
        location: str(parsed.location),
        jobType: VALID_JOB_TYPES.includes(parsed.jobType) ? parsed.jobType : null,
        websiteLink: str(parsed.websiteLink),
    };
}
