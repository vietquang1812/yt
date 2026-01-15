import { Injectable } from "@nestjs/common";
import { QueueService, PipelineStep } from "../queue/queue.service";
import { prisma } from "@yt-ai/db";

const PIPELINE: PipelineStep[] = ["script_generate","script_qa","tts_render","scene_plan","asset_fetch","video_render","shorts_render","metadata_generate","thumbnail_generate"];

@Injectable()
export class PipelineService {
  constructor(private readonly queue: QueueService) {}
  async run(projectId: string) {
    const p = await prisma.project.findUnique({ where: { id: projectId } });
    const meta = p ? { titleWorking: p.titleWorking, pillar: p.pillar, format: p.format } : undefined;
    for (const step of PIPELINE) await this.queue.enqueueStep({ projectId, step, meta });
    return { enqueued: PIPELINE };
  }
}
