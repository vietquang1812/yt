import { NextResponse } from "next/server";

const BASE = (process.env.BULL_BOARD_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");

type ProxyOpts = {
  method?: string;
  bodyText?: string;
  contentType?: string;
};

export async function proxyToBullBoard(path: string, opts: ProxyOpts = {}) {
  const url = `${BASE}${path.startsWith("/") ? "" : "/"}${path}`;

  const r = await fetch(url, {
    method: opts.method ?? "GET",
    headers: opts.contentType ? { "content-type": opts.contentType } : undefined,
    body: opts.bodyText,
    cache: "no-store",
  });

  const text = await r.text();

  // Preserve status + content-type so client can parse JSON
  return new NextResponse(text, {
    status: r.status,
    headers: {
      "content-type": r.headers.get("content-type") ?? "application/json",
    },
  });
}
