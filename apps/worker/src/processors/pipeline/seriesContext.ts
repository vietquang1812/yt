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
    continuityMode: project.continuityMode || "light",
    seriesBible: series?.bible ?? null,
    seriesMemory: series?.memory?.memory ?? null,
    seriesId: project.seriesId ?? null,
  };
}

export async function upsertSeriesMemory(seriesId: string, memory: any) {
  await prisma.seriesMemory.upsert({
    where: { seriesId },
    create: { seriesId, memory },
    update: { memory },
  });
}
