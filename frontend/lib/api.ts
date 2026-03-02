import axios from 'axios';
import { removeToken, removeUsername } from './auth';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor — injects Bearer token on every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Injected toast callback — set at app boot by ApiInterceptorSetup
type ToastFn = (type: 'error' | 'warning', message: string) => void;
let _toast: ToastFn | null = null;

export function injectToast(fn: ToastFn | null) {
    _toast = fn;
}

// Response interceptor — handles auth expiry and common HTTP errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;

        if (status === 401) {
            // Only treat as session expiry if there was a token; otherwise it's a
            // failed login attempt (wrong credentials) and should be handled by the caller.
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            if (token) {
                removeToken();
                removeUsername();
                window.location.href = '/login?expired=true';
            }
        } else if (status === 403) {
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
