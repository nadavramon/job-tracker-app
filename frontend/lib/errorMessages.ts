import { ApiError } from '@/types';

const MESSAGE_MAP: Array<[pattern: string, friendly: string]> = [
    ['invalid credentials', 'Invalid email/username or password.'],
    ['email or username already taken', 'This email or username is already registered.'],
    ['application not found', 'This application no longer exists.'],
    ['access denied', "You don't have permission to do this."],
];

export const FALLBACK_ERROR = 'Something went wrong. Please try again.';

/**
 * Extracts a user-friendly message from an Axios error (or any unknown thrown value).
 * Reads `error.response.data.message` (the backend's ErrorResponse shape) and maps
 * known substrings to friendly strings. Falls back to FALLBACK_ERROR for anything else.
 */
export function getErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'response' in error) {
        const data = (error as { response?: { data?: ApiError } }).response?.data;
        const message = data?.message;
        if (typeof message === 'string') {
            const lower = message.toLowerCase();
            for (const [pattern, friendly] of MESSAGE_MAP) {
                if (lower.includes(pattern)) return friendly;
            }
        }
    }
    return FALLBACK_ERROR;
}
