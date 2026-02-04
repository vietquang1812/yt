export async function getProjectId(context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  if (!projectId || projectId === "undefined") throw new Error("Missing projectId");
  return projectId;
}
