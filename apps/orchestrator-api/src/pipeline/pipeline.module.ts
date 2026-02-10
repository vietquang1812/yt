import { Module, forwardRef } from "@nestjs/common";
import { PipelineService } from "./pipeline.service";
import { ProjectsModule } from "../projects/projects.module";

@Module({
  imports: [forwardRef(() => ProjectsModule)],
  providers: [PipelineService],
  exports: [PipelineService],
})
export class PipelineModule {}
