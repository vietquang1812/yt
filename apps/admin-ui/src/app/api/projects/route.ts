import { proxyToOrchestrator } from "@/lib/bff/proxyToOrchestrator";

export async function GET() {
  return proxyToOrchestrator("/projects");
}

export async function POST(req: Request) {
  const bodyText = await req.text();
  return proxyToOrchestrator("/projects", {
    method: "POST",
    bodyText,
    contentType: "application/json",
  });
}
