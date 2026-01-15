import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { prisma, ProjectStatus } from "@yt-ai/db";

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}
  async create(dto: any) {
    return prisma.project.create({ data: { titleWorking:dto.titleWorking, pillar:dto.pillar, format:dto.format, language:dto.language||"en", status: ProjectStatus.IDEA_SELECTED } });
  }
  async get(id: string) {
    const p = await prisma.project.findUnique({ where:{id}, include:{ artifacts:true, jobs:true, analytics:true } });
    if (!p) throw new NotFoundException("Project not found");
    return p;
  }
  async listArtifacts(projectId: string) {
    return prisma.artifact.findMany({ where:{projectId}, orderBy:{createdAt:"asc"} });
  }
}
