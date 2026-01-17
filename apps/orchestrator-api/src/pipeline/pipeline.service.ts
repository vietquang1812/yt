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

    // MVP: enqueue tuần tự theo thứ tự phụ thuộc
    // (worker sẽ xử lý, trạng thái job/artifact cập nhật sau)
    const jobs = [];
    for (const step of ordered) {
      const job = await this.queue.enqueueStep({
        projectId,
        step: step.name as any, // nếu bạn có union type PipelineStep thì map ở đây
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
}
