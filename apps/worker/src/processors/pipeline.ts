import { Job } from "bullmq";
import { prisma, ArtifactType } from "@yt-ai/db";
import { loadPrompt } from "../lib/promptLoader";
import { renderTemplate } from "../lib/template";
import { llmComplete } from "../lib/llmClient";
import { saveArtifact } from "../lib/artifacts";

type PipelineStep = "script_generate" | "script_refine" | "script_finalize";

async function setProgress(job: Job, value: number, msg?: string) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  await job.updateProgress(msg ? { value: v, msg } : v);
}

async function getLatestArtifact(projectId: string, type: ArtifactType) {
  return prisma.artifact.findFirst({
    where: { projectId, type },
    orderBy: { createdAt: "desc" },
  });
}

export async function handlePipelineJob(job: Job<any>) {
  const step = job.name as PipelineStep; // BullMQ job.name = step
  const { projectId } = job.data as { projectId: string; meta?: any };

  await setProgress(job, 1, "starting");

  // (tuỳ bạn) validate project tồn tại
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error(`Project not found: ${projectId}`);

  if (step === "script_generate") {
    await setProgress(job, 10, "loading prompt");
    const tmpl = await loadPrompt("script_generate");

    const prompt = renderTemplate(tmpl, {
      topic: project.topic || "Untitled topic",
      duration_minutes: 6,
      format: project.format || "youtube_long",
    });

    await setProgress(job, 35, "calling llm");
    const resp = await llmComplete(prompt);

    await setProgress(job, 75, "saving artifact");
    await saveArtifact({
      projectId,
      type: ArtifactType.SCRIPT_DRAFT_JSON,
      filename: "script_draft.json",
      content: Buffer.from(resp.text, "utf8"),
      meta: { step: "script_generate" },
    });

    await setProgress(job, 100, "done");
    return;
  }

  if (step === "script_refine") {
    await setProgress(job, 10, "loading previous draft");
    const draft = await getLatestArtifact(projectId, ArtifactType.SCRIPT_DRAFT_JSON);
    if (!draft) throw new Error("Missing SCRIPT_DRAFT. Run script_generate first.");

    // đọc nội dung draft từ uri (local storage path)
    const fs = await import("node:fs/promises");
    const draftJson = await fs.readFile(draft.uri, "utf8");

    await setProgress(job, 25, "loading prompt");
    const tmpl = await loadPrompt("script_refine");
    const prompt = renderTemplate(tmpl, { script_json: draftJson });

    await setProgress(job, 55, "calling llm");
    const resp = await llmComplete(prompt);

    await setProgress(job, 80, "saving refined");
    await saveArtifact({
      projectId,
      type: ArtifactType.SCRIPT_FINAL_MD, // hoặc tạo enum SCRIPT_REFINED nếu bạn muốn tách
      filename: "script_refined.json",
      content: Buffer.from(resp.text, "utf8"),
      meta: { step: "script_refine" },
    });

    await setProgress(job, 100, "done");
    return;
  }

  if (step === "script_finalize") {
    await setProgress(job, 10, "loading refined");
    const refined = await getLatestArtifact(projectId, ArtifactType.SCRIPT_FINAL_MD);
    if (!refined) throw new Error("Missing SCRIPT_FINAL(refined json). Run script_refine first.");

    const fs = await import("node:fs/promises");
    const refinedJson = await fs.readFile(refined.uri, "utf8");

    await setProgress(job, 25, "loading prompt");
    const tmpl = await loadPrompt("script_finalize");
    const prompt = renderTemplate(tmpl, { draft_text: refinedJson });

    await setProgress(job, 60, "calling llm");
    const resp = await llmComplete(prompt);

    await setProgress(job, 85, "saving final script");
    await saveArtifact({
      projectId,
      type: ArtifactType.SCRIPT_FINAL_MD, // nếu bạn muốn tách: thêm enum SCRIPT_FINAL_TEXT
      filename: "script_final.md",
      content: Buffer.from(resp.text, "utf8"),
      meta: { step: "script_finalize", format: "markdown" },
    });

    await setProgress(job, 100, "done");
    return;
  }

  // default
  await setProgress(job, 100, "done (unknown step)");
}
