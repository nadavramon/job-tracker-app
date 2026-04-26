import api from '@/lib/api';
import * as auth from '@/lib/auth';

jest.mock('@/lib/auth', () => ({
    getUsername: jest.fn(),
    removeUsername: jest.fn(),
}));

const mockGetUsername = auth.getUsername as jest.Mock;
const mockRemoveUsername = auth.removeUsername as jest.Mock;

// Access the response error interceptor directly
function getErrorInterceptor(): (error: unknown) => Promise<unknown> {
    const handlers = (api.interceptors.response as unknown as {
        handlers: Array<{ rejected: (error: unknown) => Promise<unknown> }>;
    }).handlers;
    return handlers[0].rejected;
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('api interceptor - refresh token', () => {
    it('does not attempt refresh for auth endpoint 401s', async () => {
        const postSpy = jest.spyOn(api, 'post');
        mockGetUsername.mockReturnValue('testuser');

        const error = {
            response: { status: 401 },
            config: { url: '/auth/login', headers: {} },
        };

        const interceptor = getErrorInterceptor();
        await expect(interceptor(error)).rejects.toBeDefined();

        expect(postSpy).not.toHaveBeenCalledWith('/auth/refresh');
        expect(mockRemoveUsername).not.toHaveBeenCalled();
        postSpy.mockRestore();
    });

    it('does not attempt refresh for /auth/register 401s', async () => {
        const postSpy = jest.spyOn(api, 'post');
        mockGetUsername.mockReturnValue('testuser');

        const error = {
            response: { status: 401 },
            config: { url: '/auth/register', headers: {} },
        };

        const interceptor = getErrorInterceptor();
        await expect(interceptor(error)).rejects.toBeDefined();

        expect(postSpy).not.toHaveBeenCalledWith('/auth/refresh');
        postSpy.mockRestore();
    });

    it('does not attempt refresh when no user is logged in', async () => {
        const postSpy = jest.spyOn(api, 'post');
        mockGetUsername.mockReturnValue(null);

        const error = {
            response: { status: 401 },
            config: { url: '/applications', headers: {} },
        };

        const interceptor = getErrorInterceptor();
        await expect(interceptor(error)).rejects.toBeDefined();

        expect(postSpy).not.toHaveBeenCalledWith('/auth/refresh');
        expect(mockRemoveUsername).not.toHaveBeenCalled();
        postSpy.mockRestore();
    });

    it('attempts refresh on 401 from protected endpoint', async () => {
        mockGetUsername.mockReturnValue('testuser');

        const postSpy = jest.spyOn(api, 'post').mockResolvedValueOnce({ data: {} });

        const error = {
            response: { status: 401 },
            config: { url: '/applications', headers: {}, method: 'get' },
        };

        const interceptor = getErrorInterceptor();
        try {
            await interceptor(error);
        } catch {
            // May reject depending on retry mock
        }

        expect(postSpy).toHaveBeenCalledWith('/auth/refresh');
        postSpy.mockRestore();
    });

    it('calls removeUsername and redirects when refresh fails', async () => {
        mockGetUsername.mockReturnValue('testuser');

        jest.spyOn(api, 'post').mockRejectedValueOnce({
            response: { status: 401 },
        });

        const error = {
            response: { status: 401 },
            config: { url: '/applications', headers: {} },
        };

        const interceptor = getErrorInterceptor();
        await expect(interceptor(error)).rejects.toBeDefined();

        expect(mockRemoveUsername).toHaveBeenCalled();
    });

    it('redirects on _retry flag to prevent infinite loop', async () => {
        mockGetUsername.mockReturnValue('testuser');

        const error = {
            response: { status: 401 },
            config: { url: '/applications', headers: {}, _retry: true },
        };

        const interceptor = getErrorInterceptor();
        await expect(interceptor(error)).rejects.toBeDefined();

        expect(mockRemoveUsername).toHaveBeenCalled();
    });
});
