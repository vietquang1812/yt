export type ApiError = { status: number; message: string; details?: unknown };

async function parseJsonSafe(res: Response) {
  const text = await res.text();
  try { return text ? JSON.parse(text) : null; } catch { return text; }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { query?: Record<string, string | number | boolean | undefined> } = {}
): Promise<T> {
  // same-origin path + query
  let url = path;
  if (init.query) {
    const u = new URL(path, window.location.origin);
    for (const [k, v] of Object.entries(init.query)) {
      if (v === undefined) continue;
      u.searchParams.set(k, String(v));
    }
    url = u.pathname + u.search;
  }

  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");

  const res = await fetch(url, { ...init, headers, cache: "no-store" });
  const data = await parseJsonSafe(res);

  if (!res.ok) {
    throw {
      status: res.status,
      message: (data as any)?.message ?? res.statusText ?? "Request failed",
      details: data,
    } as ApiError;
  }

  return data as T;
}
