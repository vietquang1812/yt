import { proxyToOrchestrator } from "@/lib/bff/proxyToOrchestrator";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const channelId = req.nextUrl.searchParams.get("channelId") ?? "";
  return proxyToOrchestrator(`/prompts?channelId=${channelId}`);
}

export async function POST(req: Request) {
  const bodyText = await req.text();
  return proxyToOrchestrator("/prompts", {
    method: "POST",
    bodyText,
    contentType: "application/json",
  });
}
