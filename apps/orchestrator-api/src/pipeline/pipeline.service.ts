import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@yt-ai/db";
import { QueueService } from "../queue/queue.service";
import { loadPipelineConfig } from "./pipeline.config";
import { topoSortSteps } from "./pipeline.sort";

@Injectable()
export class PipelineService {
  constructor(private readonly queue: QueueService) {}

  async run(projectId: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException("Project not found");

    const cfg = loadPipelineConfig();
    const ordered = topoSortSteps(cfg.pipeline);

    const jobs = [];
    for (const step of ordered) {
      const job = await this.queue.enqueueStep({
        projectId,
        step: step.name as any,
      });
      jobs.push({ step: step.name, jobId: job.id });
    }

    return {
      ok: true,
      projectId,
      steps: ordered.map(s => s.name),
      jobs,
    };
  }

  // NEW: manual refine flow (button in UI)
  async refine(projectId: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException("Project not found");

    const jobs = [];
    const refineJob = await this.queue.enqueueStep({ projectId, step: "script_refine" });
    jobs.push({ step: "script_refine", jobId: refineJob.id });

    const qaJob = await this.queue.enqueueStep({ projectId, step: "script_qa" });
    jobs.push({ step: "script_qa", jobId: qaJob.id });

    return { ok: true, projectId, jobs };
  }
}
