import api from './api';
import { ExtractJobPostingOutput } from './ai/types';

export async function extractJobPosting(text: string): Promise<ExtractJobPostingOutput> {
    const response = await api.post<ExtractJobPostingOutput>('/me/ai/extract', { text });
    return response.data;
}
