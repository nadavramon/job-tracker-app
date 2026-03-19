import axios from 'axios';
import { AiResponse, ExtractJobPostingOutput } from './ai/types';

const aiApi = axios.create({
    baseURL: '/api/ai',
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

export async function extractJobPosting(text: string): Promise<ExtractJobPostingOutput> {
    const response = await aiApi.post<AiResponse<ExtractJobPostingOutput>>('/extract', { text });
    const result = response.data;

    if (!result.success) {
        throw new Error(result.message);
    }

    return result.data;
}
