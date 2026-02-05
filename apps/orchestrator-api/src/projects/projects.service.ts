import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma, ProjectStatus } from "@yt-ai/db";
import * as fs from "node:fs/promises";

type CreateProjectDto = {
  topic: string;
  language?: string;
  durationMinutes?: number;
  format?: string;
  tone?: string;
  pillar?: string;
  seriesId?: string;
  continuityMode?: "none" | "light" | "occasionally_strong";
};
const textTypes = new Set([
  "SCRIPT_FINAL_MD",
  "SCENE_PLAN_JSON",
  "METADATA_JSON",
  "QA_REPORT_JSON",
  "SCRIPT_SEGMENTS_JSON",
  "NEXT_IDEAS_JSON",
]);


@Injectable()
export class ProjectsService {
  async list() {
    return prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, topic: true, status: true, createdAt: true }
    });
  }
  async updateStatus(id: string, status: ProjectStatus) {
    const allowed = new Set<ProjectStatus>([
      ProjectStatus.IDEA_SELECTED,
      ProjectStatus.SCENES_PLANNED,   // đang thực hiện video
      ProjectStatus.VIDEO_RENDERED,   // đã hoàn thành
      ProjectStatus.PUBLISHED,        // đã public
    ]);

    if (!allowed.has(status)) {
      throw new BadRequestException(`Invalid status for manual update: ${status}`);
    }

    return prisma.project.update({
      where: { id },
      data: { status },
    });
  }


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
        seriesId: dto.seriesId ?? null,
        continuityMode: dto.continuityMode ?? "light",
      },
    });
  }

  async get(id: string) {
    const p = await prisma.project.findUnique({
      where: { id },
      include: { artifacts: true, jobs: true, analytics: true, series: true },
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

  async getArtifactContent(artifactId: string) {
    const artifact = await prisma.artifact.findUnique({ where: { id: artifactId } });
    if (!artifact) throw new NotFoundException("Artifact not found");

    const buf = await fs.readFile(artifact.uri);

    if (textTypes.has(artifact.type)) {
      return { id: artifact.id, type: artifact.type, content: buf.toString("utf8") };
    }

    return { id: artifact.id, type: artifact.type, base64: buf.toString("base64") };
  }
}
