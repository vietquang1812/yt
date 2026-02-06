import type { Job } from "bullmq";
import type { Project } from "@yt-ai/db";
import { ArtifactType, ProjectStatus } from "@yt-ai/db";
import fs from "node:fs/promises";

import { loadPrompt } from "../../../lib/promptLoader";
import { renderTemplate } from "../../../lib/template";
import { llmComplete } from "../../../lib/llmClient";
import { saveArtifact } from "../../../lib/artifacts";

import { setProgress } from "../progress";
import { setProjectStatus } from "../status";
import { getLatestArtifact } from "../artifacts";

export async function handleScriptQA(job: Job, project: Project) {
  const projectId = project.id;

  await setProgress(job, 10, "loading latest script");

  const scriptArtifact = await getLatestArtifact(projectId, ArtifactType.SCRIPT_FINAL_MD);
  if (!scriptArtifact?.uri) {
    throw new Error("script_qa: missing SCRIPT_FINAL_MD artifact. Run prompt_generate_prompt_content first.");
  }

  const scriptText = await fs.readFile(scriptArtifact.uri, "utf8");

  await setProgress(job, 30, "loading qa prompt");
  const qaTmpl = await loadPrompt("script_qa");

  const qaPrompt = renderTemplate(qaTmpl, {
    topic: project.topic || "Untitled topic",
    angle: project.pillar || "calm psychological reframe",
    script_text: scriptText,
  });

  await setProgress(job, 55, "calling llm for qa");
  const resp = await llmComplete(qaPrompt);

  let report: any;
  try {
    report = JSON.parse(resp.text);
  } catch {
    throw new Error("script_qa: model did not return valid JSON");
  }

  await setProgress(job, 75, "saving qa report");
  await saveArtifact({
    projectId,
    type: ArtifactType.QA_REPORT_JSON,
    filename: "qa_report.json",
    content: Buffer.from(JSON.stringify(report, null, 2), "utf8"),
    meta: { step: "script_qa" },
  });

  if (report?.approved !== true) {
    throw new Error("script_qa: NOT APPROVED (see qa_report.json for details)");
  }

  await setProjectStatus(projectId, ProjectStatus.SCRIPT_QA_PASSED);
  await setProgress(job, 100, "approved");
}
