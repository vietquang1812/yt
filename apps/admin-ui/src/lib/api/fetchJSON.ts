 export async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
    const r = await fetch(url, { cache: "no-store", ...init });
    const text = await r.text();

    let data: any = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch { }

    if (!r.ok) {
        const msg = data?.error || data?.message || `Request failed: ${r.status}`;
        throw new Error(msg);
    }

    return data as T;
}