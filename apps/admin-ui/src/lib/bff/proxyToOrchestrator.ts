import { NextResponse } from "next/server";

const BASE = (process.env.ORCH_API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

type ProxyOpts = {
  method?: string;
  bodyText?: string;
  contentType?: string | null; // Cho phép null để xóa header khi cần
  body?: BodyInit | ReadableStream; // Hỗ trợ thêm Stream từ req.body
};

export async function proxyToOrchestrator(path: string, opts: ProxyOpts = {}) {
  const url = `${BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  
  const headers = new Headers();
  
  // 1. Xử lý Header Content-Type
  if (opts.body instanceof FormData) {
    // KHÔNG set Content-Type để fetch tự sinh boundary chuẩn
  } else if (opts.contentType) {
    headers.set("content-type", opts.contentType);
  } else if (opts.bodyText) {
    headers.set("content-type", "application/json");
  }

  // 2. Cấu hình Fetch
  const fetchOptions: RequestInit & { duplex?: string } = {
    method: opts.method ?? "GET",
    headers: headers,
    body: opts.body ?? opts.bodyText,
    cache: "no-store",
    // Quan trọng khi truyền req.body trực tiếp trong môi trường Node.js (Next.js Runtime)
    ...(opts.body instanceof ReadableStream ? { duplex: 'half' } : {}),
  };

  const r = await fetch(url, fetchOptions);

  // 3. Trả về Response
  const text = await r.text();

  return new NextResponse(text, {
    status: r.status,
    headers: {
      "content-type": r.headers.get("content-type") ?? "application/json",
    },
  });
}