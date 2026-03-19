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
