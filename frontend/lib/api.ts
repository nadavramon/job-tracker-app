import axios from 'axios';
import { getUsername, removeToken, removeUsername } from './auth';

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

// Response interceptor — handles auth expiry and common HTTP errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;

        if (status === 401) {
            // Only treat as session expiry if there was a logged-in user; otherwise it's a
            // failed login attempt (wrong credentials) and should be handled by the caller.
            const username = getUsername();
            if (username) {
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
