import { ApiError } from '@/types';

const MESSAGE_MAP: Array<[pattern: string, friendly: string]> = [
    ['invalid credentials', 'Invalid email/username or password.'],
    ['current password is incorrect', 'Current password is incorrect.'],
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
        const axiosError = error as { response?: { status?: number; data?: ApiError } };
        const status = axiosError.response?.status;
        const data = axiosError.response?.data;
        const message = data?.message;
        if (typeof message === 'string') {
            const lower = message.toLowerCase();
            for (const [pattern, friendly] of MESSAGE_MAP) {
                if (lower.includes(pattern)) return friendly;
            }
            // Surface validation messages from 400 responses directly
            if (status === 400) return message;
        }
    }
    return FALLBACK_ERROR;
}
