import { getProjectId } from "@/features/projects/getProjectId";
import { proxyToBullBoard } from "@/lib/bff/proxy";

export async function POST(_req: Request, context: { params: Promise<{ projectId: string }> }) {
  const projectId = await getProjectId(context);
  if (!projectId || projectId === "undefined") {
    return new Response("Missing projectId", { status: 400 });
  }
  return proxyToBullBoard(`/admin/api/projects/${projectId}/segments`, { method: "POST" });
}
