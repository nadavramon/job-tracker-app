import { getErrorMessage, FALLBACK_ERROR } from '@/lib/errorMessages';

function axiosError(message: string, status?: number) {
    return { response: { status, data: { message } } };
}

describe('getErrorMessage', () => {
    it('maps "Invalid credentials" to a friendly login message', () => {
        expect(getErrorMessage(axiosError('Invalid credentials'))).toBe(
            'Invalid email/username or password.'
        );
    });

    it('is case-insensitive for pattern matching', () => {
        expect(getErrorMessage(axiosError('INVALID CREDENTIALS'))).toBe(
            'Invalid email/username or password.'
        );
    });

    it('maps "Email or username already taken" to a friendly registration message', () => {
        expect(getErrorMessage(axiosError('Email or username already taken'))).toBe(
            'This email or username is already registered.'
        );
    });

    it('maps "Application not found" to a friendly application message', () => {
        expect(getErrorMessage(axiosError('Application not found'))).toBe(
            'This application no longer exists.'
        );
    });

    it('maps "Access denied" to a friendly permission message', () => {
        expect(getErrorMessage(axiosError('Access denied'))).toBe(
            "You don't have permission to do this."
        );
    });

    it('surfaces raw message for 400 validation errors', () => {
        expect(getErrorMessage(axiosError('websiteLink: must be a valid http or https URL', 400))).toBe(
            'websiteLink: must be a valid http or https URL'
        );
    });

    it('returns fallback for non-400 unknown messages', () => {
        expect(getErrorMessage(axiosError('Unexpected internal error', 500))).toBe(FALLBACK_ERROR);
    });

    it('returns fallback for an unknown backend message without status', () => {
        expect(getErrorMessage(axiosError('Unexpected internal error'))).toBe(FALLBACK_ERROR);
    });

    it('returns fallback for a plain Error with no response', () => {
        expect(getErrorMessage(new Error('Network error'))).toBe(FALLBACK_ERROR);
    });

    it('returns fallback for null', () => {
        expect(getErrorMessage(null)).toBe(FALLBACK_ERROR);
    });

    it('returns fallback for undefined', () => {
        expect(getErrorMessage(undefined)).toBe(FALLBACK_ERROR);
    });

    it('returns fallback when response has no data', () => {
        expect(getErrorMessage({ response: {} })).toBe(FALLBACK_ERROR);
    });

    it('returns fallback when response data message is not a string', () => {
        expect(getErrorMessage({ response: { data: { message: 42 } } })).toBe(FALLBACK_ERROR);
    });

    it('maps "Session invalidated for security reasons" to a friendly message', () => {
        expect(getErrorMessage(axiosError('Session invalidated for security reasons'))).toBe(
            'Your session was ended for security reasons. Please log in again.'
        );
    });
});
