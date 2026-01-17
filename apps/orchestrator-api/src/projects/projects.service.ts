import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma, ProjectStatus } from "@yt-ai/db";

type CreateProjectDto = {
  topic: string;
  language?: string;
  durationMinutes?: number;
  format?: string;
  tone?: string;
  pillar?: string;
};

@Injectable()
export class ProjectsService {
  async create(dto: CreateProjectDto) {
    if (!dto.topic || !dto.topic.trim()) {
      throw new BadRequestException("topic is required");
    }

    return prisma.project.create({
      data: {
        topic: dto.topic.trim(),
        language: dto.language ?? "en",
        durationMinutes: dto.durationMinutes ?? 6,
        format: dto.format ?? "youtube_long",
        tone: dto.tone,
        pillar: dto.pillar,
        status: ProjectStatus.IDEA_SELECTED,
      },
    });
  }

  async get(id: string) {
    const p = await prisma.project.findUnique({
      where: { id },
      include: { artifacts: true, jobs: true, analytics: true },
    });
    if (!p) throw new NotFoundException("Project not found");
    return p;
  }

  async listArtifacts(projectId: string) {
    return prisma.artifact.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    });
  }
}
