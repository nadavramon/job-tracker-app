'use client';

import { useEffect } from 'react';
import { getTokenExpiry, removeToken, removeUsername, getToken } from './auth';

export function redirectToLogin() {
    window.location.href = '/login?expired=true';
}

/**
 * Schedules an auto-redirect to /login when the JWT expires.
 * Also re-checks on tab refocus (visibilitychange) in case the token
 * expired while the tab was in the background.
 */
export function useTokenExpiry() {
    useEffect(() => {
        function handleExpiry() {
            removeToken();
            removeUsername();
            redirectToLogin();
        }

        function checkAndSchedule(): ReturnType<typeof setTimeout> | null {
            const expiry = getTokenExpiry();
            if (expiry === null) return null;

            const msUntilExpiry = expiry - Date.now();
            if (msUntilExpiry <= 0) {
                handleExpiry();
                return null;
            }

            return setTimeout(handleExpiry, msUntilExpiry);
        }

        let timer = checkAndSchedule();

        function onVisibilityChange() {
            if (document.visibilityState !== 'visible') return;
            if (!getToken()) return;

            const expiry = getTokenExpiry();
            if (expiry !== null && Date.now() >= expiry) {
                handleExpiry();
                return;
            }

            // Reschedule in case system clock drifted during sleep
            if (timer) clearTimeout(timer);
            timer = checkAndSchedule();
        }

        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            if (timer) clearTimeout(timer);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, []);
}
