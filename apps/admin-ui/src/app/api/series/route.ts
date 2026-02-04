import { proxyToBullBoard } from "@/lib/bff/proxy";

export async function GET() {
  return proxyToBullBoard("/admin/api/series");
}

export async function POST(req: Request) {
  const bodyText = await req.text();
  return proxyToBullBoard("/admin/api/series", {
    method: "POST",
    bodyText,
    contentType: "application/json",
  });
}
