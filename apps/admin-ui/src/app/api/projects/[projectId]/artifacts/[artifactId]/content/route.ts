import { proxyToBullBoard } from "@/lib/bff/proxy";

export async function GET(
  _req: Request,
  context: { params: Promise<{ projectId: string; artifactId: string }> }
) {
  const { projectId, artifactId } = await context.params;

  if (!projectId || projectId === "undefined") {
    return new Response("Missing projectId", { status: 400 });
  }
  if (!artifactId || artifactId === "undefined") {
    return new Response("Missing artifactId", { status: 400 });
  }

  return proxyToBullBoard(
    `/admin/api/projects/${projectId}/artifacts/${artifactId}/content`
  );
}
