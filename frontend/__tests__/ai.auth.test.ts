import { validateSession, fetchUserApiKey } from '@/lib/ai/auth';

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
    mockFetch.mockReset();
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8080';
});

describe('validateSession', () => {
    it('returns true when backend responds ok', async () => {
        mockFetch.mockResolvedValue({ ok: true });

        const result = await validateSession('session-cookie');

        expect(result).toBe(true);
        expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/me', {
            headers: { Cookie: 'session-cookie' },
        });
    });

    it('returns false when backend responds not ok', async () => {
        mockFetch.mockResolvedValue({ ok: false });

        const result = await validateSession('session-cookie');

        expect(result).toBe(false);
    });

    it('returns false when fetch throws', async () => {
        mockFetch.mockRejectedValue(new Error('network error'));

        const result = await validateSession('session-cookie');

        expect(result).toBe(false);
    });
});

describe('fetchUserApiKey', () => {
    it('returns the API key when configured', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ apiKey: 'sk-ant-user-key' }),
        });

        const result = await fetchUserApiKey('session-cookie');

        expect(result).toBe('sk-ant-user-key');
        expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/me/api-key', {
            headers: { Cookie: 'session-cookie' },
        });
    });

    it('returns null when not configured (404)', async () => {
        mockFetch.mockResolvedValue({ ok: false, status: 404 });

        const result = await fetchUserApiKey('session-cookie');

        expect(result).toBeNull();
    });

    it('returns null when response has no apiKey field', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({}),
        });

        const result = await fetchUserApiKey('session-cookie');

        expect(result).toBeNull();
    });

    it('returns null when fetch throws', async () => {
        mockFetch.mockRejectedValue(new Error('network error'));

        const result = await fetchUserApiKey('session-cookie');

        expect(result).toBeNull();
    });
});
