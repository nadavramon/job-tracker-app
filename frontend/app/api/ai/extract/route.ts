import { NextRequest, NextResponse } from 'next/server';
import { validateSession, fetchUserApiKey } from '@/lib/ai/auth';
import { runAgent } from '@/lib/ai/coordinator';
import { extractJobPosting } from '@/lib/ai/agents/extractJobPosting';
import { AiErrorResponse, ExtractJobPostingInput } from '@/lib/ai/types';

const MAX_TEXT_LENGTH = 50_000;
const MAX_FETCH_BYTES = 1_024_000; // 1 MB
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 15;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function errorResponse(status: number, error: AiErrorResponse['error'], message: string) {
    return NextResponse.json({ success: false, error, message }, { status });
}

function isRateLimited(sessionKey: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(sessionKey);

    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(sessionKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return false;
    }

    entry.count++;
    return entry.count > RATE_LIMIT_MAX;
}

function isPrivateUrl(url: string): boolean {
    let hostname: string;
    try {
        hostname = new URL(url).hostname;
    } catch {
        return true;
    }

    // Block localhost variants
    if (hostname === 'localhost' || hostname === '[::1]') return true;

    // Block private/reserved IPv4 ranges
    const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
        const [, a, b] = ipv4Match.map(Number);
        if (a === 127) return true;                         // 127.0.0.0/8
        if (a === 10) return true;                          // 10.0.0.0/8
        if (a === 172 && b >= 16 && b <= 31) return true;   // 172.16.0.0/12
        if (a === 192 && b === 168) return true;            // 192.168.0.0/16
        if (a === 169 && b === 254) return true;            // 169.254.0.0/16 (link-local / cloud metadata)
        if (a === 0) return true;                           // 0.0.0.0/8
    }

    // Block IPv6 private ranges (bracketed or raw)
    const cleanHost = hostname.replace(/^\[|\]$/g, '');
    if (cleanHost === '::1' || cleanHost.startsWith('fe80:') || cleanHost.startsWith('fc') || cleanHost.startsWith('fd')) {
        return true;
    }

    return false;
}

async function fetchAndStripHtml(url: string): Promise<string> {
    if (isPrivateUrl(url)) {
        throw new Error('URL points to a private or reserved address.');
    }

    const port = new URL(url).port;
    if (port && port !== '80' && port !== '443') {
        throw new Error('Only standard HTTP ports are allowed.');
    }

    const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JobTracker/1.0)' },
        signal: AbortSignal.timeout(10_000),
        redirect: 'error',
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_FETCH_BYTES) {
        throw new Error('Page is too large to process.');
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body.');

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        totalBytes += value.byteLength;
        if (totalBytes > MAX_FETCH_BYTES) {
            reader.cancel();
            break;
        }
        chunks.push(value);
    }

    const decoder = new TextDecoder();
    const html = chunks.map((c) => decoder.decode(c, { stream: true })).join('') + decoder.decode();
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function POST(request: NextRequest) {
    const cookie = request.headers.get('cookie');
    if (!cookie || !(await validateSession(cookie))) {
        return errorResponse(401, 'INVALID_INPUT', 'Authentication required.');
    }

    const apiKey = await fetchUserApiKey(cookie);
    if (!apiKey) {
        return errorResponse(400, 'INVALID_INPUT', 'Anthropic API key not configured. Add your key in Settings.');
    }

    const sessionKey = cookie.slice(0, 64);
    if (isRateLimited(sessionKey)) {
        return errorResponse(429, 'RATE_LIMITED', 'Too many requests. Please wait a moment.');
    }

    let body: { text?: string };
    try {
        body = await request.json();
    } catch {
        return errorResponse(400, 'INVALID_INPUT', 'Invalid request body.');
    }

    const rawText = body.text?.trim();
    if (!rawText) {
        return errorResponse(400, 'INVALID_INPUT', 'Text is required.');
    }

    if (rawText.length > MAX_TEXT_LENGTH) {
        return errorResponse(400, 'INVALID_INPUT', `Text must be under ${MAX_TEXT_LENGTH.toLocaleString()} characters.`);
    }

    let input: ExtractJobPostingInput;

    if (rawText.startsWith('http://') || rawText.startsWith('https://')) {
        try {
            const pageText = await fetchAndStripHtml(rawText);
            if (!pageText) {
                return errorResponse(400, 'INVALID_INPUT', 'Could not extract text from URL.');
            }
            input = { text: pageText.slice(0, MAX_TEXT_LENGTH), sourceUrl: rawText };
        } catch {
            return errorResponse(400, 'INVALID_INPUT', 'Failed to fetch the provided URL.');
        }
    } else {
        input = { text: rawText };
    }

    const result = await runAgent(extractJobPosting, input, apiKey);

    if (!result.success) {
        const statusMap: Record<string, number> = {
            AUTH_ERROR: 401,
            RATE_LIMITED: 429,
            AI_UNAVAILABLE: 502,
            INVALID_INPUT: 400,
        };
        return errorResponse(statusMap[result.error] ?? 502, result.error, result.message);
    }

    return NextResponse.json({ success: true, data: result.data });
}
