import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";

export type PipelineStep =
  | "script_generate" | "script_refine" | "script_qa"
  | "tts_render" | "scene_plan"
  | "asset_fetch" | "video_render" | "shorts_render"
  | "metadata_generate" | "thumbnail_generate"| "script_segments_generate";

export type PipelineJobPayload = { projectId: string; step: PipelineStep; meta?: any };

function queueForStep(step: PipelineStep): "pipeline" | "llm" | "assets" | "media" {
  if (["script_generate", "script_refine", "script_qa", "metadata_generate", "thumbnail_generate",  "script_segments_generate"].includes(step)) return "llm";
  if (step === "asset_fetch") return "assets";
  if (["video_render", "shorts_render", "tts_render"].includes(step)) return "media";
  return "pipeline";
}

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue("pipeline") private readonly pipelineQueue: Queue,
    @InjectQueue("llm") private readonly llmQueue: Queue,
    @InjectQueue("assets") private readonly assetsQueue: Queue,
    @InjectQueue("media") private readonly mediaQueue: Queue,
  ) { }

  private getQueue(n: ReturnType<typeof queueForStep>) {
    return n === "llm" ? this.llmQueue : n === "assets" ? this.assetsQueue : n === "media" ? this.mediaQueue : this.pipelineQueue;
  }

  async enqueueStep(payload: { projectId: string; step: string }) {
    const qName = queueForStep(payload.step as any);
    const q = this.getQueue(qName);

    const jobId = `${payload.projectId}__${payload.step}`.replace(/[^a-zA-Z0-9_-]/g, "_");

    return q.add(payload.step, payload, {
      jobId,
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: 50,
      removeOnFail: 50,
    });
  }
}
