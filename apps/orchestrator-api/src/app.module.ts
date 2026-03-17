import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { QueueModule } from "./queue/queue.module";
import { ProjectsModule } from "./projects/projects.module";
import { PipelineModule } from "./pipeline/pipeline.module";
import { HealthModule } from "./health/health.module";
import { SeriesModule } from "./series/series.module";
import { AssetsModule } from "./assets/assets.module";
import { ChannelsModule } from "./channels/channels.module";
import { PromptsModule } from "./prompts/prompts.module";

@Module({
  imports: [PrismaModule, QueueModule, ProjectsModule, PipelineModule, HealthModule, SeriesModule, AssetsModule, ChannelsModule, PromptsModule]
})
export class AppModule {}
