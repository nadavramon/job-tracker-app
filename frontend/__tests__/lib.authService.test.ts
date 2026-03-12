import api from '@/lib/api';
import { login, register, logout } from '@/lib/authService';

jest.mock('@/lib/api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('authService', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('login sends POST to /auth/login', async () => {
        const mockResponse = { data: { token: 'jwt', username: 'user1' } };
        mockedApi.post.mockResolvedValue(mockResponse);

        const result = await login({ identifier: 'user1', password: 'pass' });

        expect(mockedApi.post).toHaveBeenCalledWith('/auth/login', {
            identifier: 'user1',
            password: 'pass',
        });
        expect(result).toEqual(mockResponse.data);
    });

    it('register sends POST to /auth/register', async () => {
        const mockResponse = { data: { token: 'jwt', username: 'newuser' } };
        mockedApi.post.mockResolvedValue(mockResponse);

        const result = await register({
            email: 'a@b.com',
            username: 'newuser',
            password: 'pass',
        });

        expect(mockedApi.post).toHaveBeenCalledWith('/auth/register', {
            email: 'a@b.com',
            username: 'newuser',
            password: 'pass',
        });
        expect(result).toEqual(mockResponse.data);
    });

    it('logout sends POST to /auth/logout', async () => {
        mockedApi.post.mockResolvedValue({});

        await logout();

        expect(mockedApi.post).toHaveBeenCalledWith('/auth/logout');
    });
});
