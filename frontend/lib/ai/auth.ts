export async function validateSession(cookie: string): Promise<boolean> {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`, {
            headers: { Cookie: cookie },
        });
        return response.ok;
    } catch {
        return false;
    }
}

export async function fetchUserApiKey(cookie: string): Promise<string | null> {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me/api-key`, {
            headers: { Cookie: cookie },
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data.apiKey ?? null;
    } catch {
        return null;
    }
}
