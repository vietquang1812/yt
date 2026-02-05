import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ProjectsService } from "./projects.service";
import { PipelineService } from "../pipeline/pipeline.service";
import { Query } from "@nestjs/common";

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


@Controller("projects")
export class ProjectsController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly pipeline: PipelineService
  ) { }

  @Get()
  list() {
    return this.projects.list();
  }

  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.projects.create(dto);
  }

  @Post(":id/status")
  setStatus(@Param("id") id: string, @Body() dto: { status: string }) {
    return this.projects.updateStatus(id, dto.status as any);
  }

  @Post(":id/segments")
  segments(@Param("id") id: string) {
    return this.pipeline.segments(id);
  }


  @Post(":id/run")
  run(@Param("id") id: string) {
    return this.pipeline.run(id);
  }

  // NEW: manual refine button (run refine then QA)
  @Post(":id/refine")
  refine(@Param("id") id: string) {
    return this.pipeline.refine(id);
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

  @Post(":id/prompts/preview")
  previewPrompt(
    @Param("id") id: string,
    @Query("step") step: string
  ) {
    return this.projects.previewPrompt(id, step);
  }

  @Get(":id/prompts/status")
  promptStatus(@Param("id") id: string) {
    return this.projects.getPromptStatus(id);
  }

  @Get(":id/prompts/content")
  promptContent(@Param("id") id: string, @Query("step") step?: string) {
    return this.projects.getPromptContent(id, step);
  }

  @Post(":id/prompts/ensure")
  ensurePrompt(@Param("id") id: string, @Query("step") step?: string) {
    return this.projects.ensurePrompt(id, step);
  }

}
