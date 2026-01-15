import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { QueueModule } from "./queue/queue.module";
import { ProjectsModule } from "./projects/projects.module";
import { PipelineModule } from "./pipeline/pipeline.module";
import { HealthModule } from "./health/health.module";

@Module({ imports: [PrismaModule, QueueModule, ProjectsModule, PipelineModule, HealthModule] })
export class AppModule {}
