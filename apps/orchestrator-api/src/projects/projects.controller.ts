import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ProjectsService } from "./projects.service";
import { PipelineService } from "../pipeline/pipeline.service";

type CreateProjectDto = {
  topic: string;
  language?: string;
  durationMinutes?: number;
  format?: string; // "youtube_long" | "shorts" (tuỳ bạn)
  tone?: string;
  pillar?: string;
};

@Controller("projects")
export class ProjectsController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly pipeline: PipelineService
  ) {}
  
  @Get()
  list() {
    return this.projects.list();
  }

  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.projects.create(dto);
  }

  @Post(":id/run")
  run(@Param("id") id: string) {
    return this.pipeline.run(id);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.projects.get(id);
  }

  @Get(":id/artifacts")
  artifacts(@Param("id") id: string) {
    return this.projects.listArtifacts(id);
  }

  @Get(":id/artifacts/:artifactId/content")
  artifactContent(@Param("artifactId") artifactId: string) {
    return this.projects.getArtifactContent(artifactId);
  }
}
