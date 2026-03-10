import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { QueueModule } from "./queue/queue.module";
import { ProjectsModule } from "./projects/projects.module";
import { PipelineModule } from "./pipeline/pipeline.module";
import { HealthModule } from "./health/health.module";
import { SeriesModule } from "./series/series.module";
import { AssetsModule } from "./assets/assets.module";

@Module({
  imports: [PrismaModule, QueueModule, ProjectsModule, PipelineModule, HealthModule, SeriesModule, AssetsModule]
})
export class AppModule {}
