import { Module, forwardRef } from "@nestjs/common";
import { ProjectsController } from "./projects.controller";
import { ProjectsService } from "./projects.service";
import { PipelineModule } from "../pipeline/pipeline.module";

@Module({
  imports: [forwardRef(() => PipelineModule)],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
