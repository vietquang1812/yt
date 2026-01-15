import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";

export type PipelineStep =
  | "script_generate" | "script_qa" | "tts_render" | "scene_plan"
  | "asset_fetch" | "video_render" | "shorts_render" | "metadata_generate" | "thumbnail_generate";

export type PipelineJobPayload = { projectId: string; step: PipelineStep; meta?: any };

function queueForStep(step: PipelineStep): "pipeline"|"llm"|"assets"|"media" {
  if (["script_generate","script_qa","metadata_generate","thumbnail_generate"].includes(step)) return "llm";
  if (step === "asset_fetch") return "assets";
  if (["video_render","shorts_render","tts_render"].includes(step)) return "media";
  return "pipeline";
}
function makeJobId(projectId: string, step: PipelineStep) { return `${projectId}__${step}`.replace(/[^a-zA-Z0-9_-]/g, "_"); }

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue("pipeline") private readonly pipelineQueue: Queue,
    @InjectQueue("llm") private readonly llmQueue: Queue,
    @InjectQueue("assets") private readonly assetsQueue: Queue,
    @InjectQueue("media") private readonly mediaQueue: Queue,
  ) {}
  private getQueue(n: ReturnType<typeof queueForStep>) {
    return n==="llm"?this.llmQueue : n==="assets"?this.assetsQueue : n==="media"?this.mediaQueue : this.pipelineQueue;
  }
  async enqueueStep(payload: PipelineJobPayload) {
    const q = this.getQueue(queueForStep(payload.step));
    return q.add(payload.step, payload, { jobId: makeJobId(payload.projectId, payload.step), attempts:3, backoff:{type:"exponential",delay:2000} });
  }
}
