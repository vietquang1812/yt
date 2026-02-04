import { proxyToBullBoard } from "@/lib/bff/proxy";

export async function GET() {
  return proxyToBullBoard("/admin/api/projects");
}

export async function POST(req: Request) {
  const bodyText = await req.text();
  return proxyToBullBoard("/admin/api/projects", {
    method: "POST",
    bodyText,
    contentType: "application/json",
  });
}
