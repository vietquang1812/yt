import { proxyToOrchestrator } from "@/lib/bff/proxyToOrchestrator";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const channelId = req.nextUrl.searchParams.get("channelId") ?? "";
  return proxyToOrchestrator(`/projects?channelId=${channelId}`);
}

export async function POST(req: Request) {
  const bodyText = await req.text();
  return proxyToOrchestrator("/projects", {
    method: "POST",
    bodyText,
    contentType: "application/json",
  });
}
