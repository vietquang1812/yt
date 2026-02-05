import { Job } from "bullmq";
import { prisma, ProjectStatus } from "@yt-ai/db";
import type { PipelineStep } from "./pipeline/types";
import { setProgress } from "./pipeline/progress";
import { setProjectStatus } from "./pipeline/status";

import { handleMetadataGenerate } from "./pipeline/steps/metadataGenerate";
import { handleScriptQA } from "./pipeline/steps/scriptQA";
import { handleScriptRefine } from "./pipeline/steps/scriptRefine";
import { handleScriptSegmentsGenerate } from "./pipeline/steps/scriptSegmentsGenerate";
import { handleThumbnailGenerate } from "./pipeline/steps/thumbnailGenerate";
import { Queue } from "bullmq";
import { connection } from "../redis";
const llmQueue = new Queue("llm", { connection });

function makeJobId(projectId: string, step: string) {
  return `${projectId}__${step}`.replace(/[^a-zA-Z0-9_-]/g, "_");
}

async function enqueueLLMStep(projectId: string, step: string) {
  return llmQueue.add(
    step,
    { projectId, step },
    {
      jobId: makeJobId(projectId, step),
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: 50,
      removeOnFail: 50,
    }
  );
}

export async function handlePipelineJob(job: Job<any>) {
  const step = job.name as PipelineStep;
  const { projectId } = job.data as { projectId: string; meta?: any };

  try {
    await setProgress(job, 1, "starting");

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error(`Project not found: ${projectId}`);

    if (step === "metadata_generate") {
      await handleMetadataGenerate(job, project);
      await enqueueLLMStep(projectId, "script_qa");
      return;
    }

    if (step === "script_qa") {
      await handleScriptQA(job, project);
      return;
    }

    if (step === "script_refine") {
      await handleScriptRefine(job, project);
      return;
    }

    if (step === "script_segments_generate") {
      await handleScriptSegmentsGenerate(job, project);
      return;
    }

    if (step === "thumbnail_generate") {
      await handleThumbnailGenerate(job, project);
      return;
    }

    await setProgress(job, 100, "done (unknown step)");
  } catch (err) {
    // mark failed (đừng để UI/DB bị treo trạng thái)
    try {
      await setProjectStatus(projectId, ProjectStatus.FAILED);
    } catch {}
    throw err;
  }
}
