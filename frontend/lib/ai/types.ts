import { JobType } from '@/types';

export type AiErrorCode =
    | 'AI_UNAVAILABLE'
    | 'INVALID_INPUT'
    | 'EXTRACTION_FAILED'
    | 'RATE_LIMITED';

export interface AiErrorResponse {
    success: false;
    error: AiErrorCode;
    message: string;
}

export interface AiSuccessResponse<T> {
    success: true;
    data: T;
}

export type AiResponse<T> = AiSuccessResponse<T> | AiErrorResponse;

export interface ExtractJobPostingInput {
    text: string;
    sourceUrl?: string;
}

export interface ExtractJobPostingOutput {
    companyName: string | null;
    jobRole: string | null;
    location: string | null;
    jobType: JobType | null;
    websiteLink: string | null;
}
