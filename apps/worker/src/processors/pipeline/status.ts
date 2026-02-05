import { prisma, ProjectStatus } from "@yt-ai/db";

export async function setProjectStatus(projectId: string, status: ProjectStatus) {
  await prisma.project.update({
    where: { id: projectId },
    data: { status },
  });
}
