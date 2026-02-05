// apps/orchestrator-api/src/projects/prompts/seriesContext.ts
import { prisma } from "@yt-ai/db";

export async function loadSeriesContext(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { series: true },
  });
  if (!project) throw new Error("Project not found");

  const series = project.seriesId
    ? await prisma.series.findUnique({
        where: { id: project.seriesId },
        include: { memory: true },
      })
    : null;

  return {
    project,
    continuityMode: project.continuityMode || "light",
    seriesBible: series?.bible ?? {},
    seriesMemory: series?.memory?.memory ?? {},
  };
}
