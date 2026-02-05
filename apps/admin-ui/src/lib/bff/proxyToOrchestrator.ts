import { NextResponse } from "next/server";

const BASE = (process.env.ORCH_API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

type ProxyOpts = {
  method?: string;
  bodyText?: string;
  contentType?: string;
};

export async function proxyToOrchestrator(path: string, opts: ProxyOpts = {}) {
  const url = `${BASE}${path.startsWith("/") ? "" : "/"}${path}`;

  const r = await fetch(url, {
    method: opts.method ?? "GET",
    headers: opts.contentType ? { "content-type": opts.contentType } : undefined,
    body: opts.bodyText,
    cache: "no-store",
  });

  const text = await r.text();

  return new NextResponse(text, {
    status: r.status,
    headers: {
      "content-type": r.headers.get("content-type") ?? "application/json",
    },
  });
}
