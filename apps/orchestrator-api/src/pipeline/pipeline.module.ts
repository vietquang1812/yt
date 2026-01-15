import { Module } from "@nestjs/common";
import { PipelineService } from "./pipeline.service";
import { QueueModule } from "../queue/queue.module";

@Module({
  imports: [QueueModule],
  providers: [PipelineService],
  exports: [PipelineService],
})
export class PipelineModule {}
