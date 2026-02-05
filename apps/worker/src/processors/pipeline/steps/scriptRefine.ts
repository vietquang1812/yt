import type { Job } from "bullmq";
import type { Project } from "@yt-ai/db";
import { ArtifactType, ProjectStatus } from "@yt-ai/db";
import fs from "node:fs/promises";

import { loadPrompt } from "../../../lib/promptLoader";
import { renderTemplate } from "../../../lib/template";
import { llmComplete } from "../../../lib/llmClient";

import { setProgress } from "../progress";
import { setProjectStatus } from "../status";
import { getLatestArtifact, saveScriptAndMeta } from "../artifacts";
import { loadSeriesContext, upsertSeriesMemory } from "../seriesContext";
import { validateScriptPack } from "../validators/scriptPack";

export async function handleScriptRefine(job: Job, project: Project) {
  const projectId = project.id;

  await setProgress(job, 10, "loading latest script + qa report");

  const scriptArt = await getLatestArtifact(projectId, ArtifactType.SCRIPT_FINAL_MD);
  const qaArt = await getLatestArtifact(projectId, ArtifactType.QA_REPORT_JSON);

  if (!scriptArt?.uri) throw new Error("script_refine: missing SCRIPT_FINAL_MD");
  if (!qaArt?.uri) throw new Error("script_refine: missing QA_REPORT_JSON (run script_qa first)");

  const scriptText = await fs.readFile(scriptArt.uri, "utf8");
  const qaReportText = await fs.readFile(qaArt.uri, "utf8");

  await setProgress(job, 30, "loading refine prompt");
  const refineTmpl = await loadPrompt("script_refine");

  const ctx = await loadSeriesContext(projectId);
  if (ctx.seriesId) {
    await upsertSeriesMemory(ctx.seriesId, {
      updatedAt: new Date().toISOString(),
      last_project_id: projectId,
      last_topic: project.topic,
    });
  }

  const refinePrompt = renderTemplate(refineTmpl, {
    topic: project.topic || "Untitled topic",
    angle: project.pillar || "calm psychological reframe",
    script_text: scriptText,
    qa_report_json: qaReportText,
  });

  await setProgress(job, 55, "calling llm to refine");
  const resp = await llmComplete(refinePrompt);

  let pack: any;
  try {
    pack = JSON.parse(resp.text);
  } catch {
    throw new Error("script_refine: model did not return valid JSON");
  }

  await setProgress(job, 70, "validating refined content");
  pack = validateScriptPack(pack);

  await setProgress(job, 85, "saving refined script");
  await saveScriptAndMeta(projectId, pack, "script_refine");

  await setProjectStatus(projectId, ProjectStatus.SCRIPT_REFINED);
  await setProgress(job, 100, "refined");
}
