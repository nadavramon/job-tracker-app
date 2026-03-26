import api from './api';
import { AiResponse, ExtractJobPostingOutput } from './ai/types';

export async function extractJobPosting(text: string): Promise<ExtractJobPostingOutput> {
    const response = await api.post<AiResponse<ExtractJobPostingOutput>>('/api/ai/extract', { text }, {
        baseURL: '',
    });
    const result = response.data;

    if (!result.success) {
        throw new Error(result.message);
    }

    return result.data;
}
