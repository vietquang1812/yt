import { getProjectId } from "@/features/projects/getProjectId";
import { proxyToBullBoard } from "@/lib/bff/proxy";

export async function POST(
  req: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const projectId = await getProjectId(context);
  if (!projectId || projectId === "undefined") {
    return new Response("Missing projectId", { status: 400 });
  }

  const bodyText = await req.text();
  return proxyToBullBoard(`/admin/api/projects/${projectId}/status`, {
    method: "POST",
    bodyText,
    contentType: req.headers.get("content-type") ?? "application/json",
  });
}
