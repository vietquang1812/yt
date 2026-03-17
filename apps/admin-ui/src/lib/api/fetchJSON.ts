export async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
    const headers = new Headers(init?.headers);

    // KIỂM TRA: Nếu body là FormData, hãy để trình duyệt tự lo Content-Type
    if (init?.body instanceof FormData) {
        headers.delete("Content-Type"); 
    } else if (!headers.has("Content-Type")) {
        // Chỉ mặc định là JSON nếu không phải gửi file
        headers.set("Content-Type", "application/json");
    }

    const r = await fetch(url, { 
        cache: "no-store", 
        ...init, 
        headers // Sử dụng headers đã xử lý
    });
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