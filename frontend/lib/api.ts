import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getUsername, removeUsername } from './auth';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Injected toast callback — set at app boot by ApiInterceptorSetup
type ToastFn = (type: 'error' | 'warning', message: string) => void;
let _toast: ToastFn | null = null;

export function injectToast(fn: ToastFn | null) {
    _toast = fn;
}

// --- Refresh token logic ---

const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/logout', '/auth/refresh'];

let isRefreshing = false;
let refreshQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown | null) {
    refreshQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve();
        }
    });
    refreshQueue = [];
}

function redirectToLogin() {
    removeUsername();
    if (typeof window !== 'undefined') {
        window.location.href = '/login?expired=true';
    }
}

// Response interceptor — handles auth expiry, refresh, and common HTTP errors
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const status = error.response?.status;
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (status === 401 && originalRequest) {
            const requestPath = originalRequest.url || '';

            // Auth endpoint 401s (login/register) pass through — no refresh attempt
            if (AUTH_PATHS.some((path) => requestPath.startsWith(path))) {
                return Promise.reject(error);
            }

            // No logged-in user — nothing to refresh
            if (!getUsername()) {
                return Promise.reject(error);
            }

            // Prevent infinite loop
            if (originalRequest._retry) {
                redirectToLogin();
                return Promise.reject(error);
            }

            // If a refresh is already in flight, queue this request
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    refreshQueue.push({ resolve, reject });
                }).then(() => {
                    originalRequest._retry = true;
                    return api(originalRequest);
                });
            }

            isRefreshing = true;
            originalRequest._retry = true;

            try {
                await api.post('/auth/refresh');
                processQueue(null);
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);
                redirectToLogin();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        if (status === 403) {
            _toast?.('error', "You don't have permission");
        } else if (status === 500) {
            _toast?.('error', 'Server error — please try again');
        } else if (!error.response) {
            _toast?.('error', 'Connection failed');
        }

        return Promise.reject(error);
    },
);

export default api;
