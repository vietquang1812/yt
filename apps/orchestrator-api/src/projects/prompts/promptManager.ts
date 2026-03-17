// apps/orchestrator-api/src/projects/prompts/promptManager.ts
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { BadRequestException } from "@nestjs/common";
import { PromptStep, PromptStatus } from "../types";
import { exists, ensureDir } from "../utils/fs";
import { safeProjectId, promptFilePath, projectRootDir } from "../utils/paths";
import { buildScriptQAPrompt } from "./buildScriptQAPrompt";
import { buildMetadataGeneratePrompt } from "./buildMetadataGeneratePrompt";
import { buildScriptRefinePrompt } from "./buildScriptRefinePrompt";
import { buildSegmentsGeneratePrompt } from "./buildSegmentsGeneratePrompt";

export async function getPromptStatus(projectId: string) {
  safeProjectId(projectId);

  const root = projectRootDir(projectId);

  // prompt_generate_prompt_content
  const metaPath = promptFilePath(projectId, "prompt_generate_prompt_content");
  const metaExists = await exists(metaPath);

  // script_qa
  const qaPath = promptFilePath(projectId, "script_qa");
  const qaExists = await exists(qaPath);
  const qaPrereq = [
    path.join(root, "script_final.md"),
    path.join(root, "metadata.json"),
    path.join(root, "next_ideas.json"),
  ];
  const qaPrereqExists = await Promise.all(qaPrereq.map(exists));
  const qaMissing: string[] = [];
  if (!qaPrereqExists[0]) qaMissing.push("script_final.md");
  if (!qaPrereqExists[1]) qaMissing.push("metadata.json");
  if (!qaPrereqExists[2]) qaMissing.push("next_ideas.json");
  const qaEnabled = qaExists || qaMissing.length === 0;

  // script_refine
  const refinePath = promptFilePath(projectId, "script_refine");
  const refineExists = await exists(refinePath);
  const refinePrereq = [path.join(root, "script_final.md"), path.join(root, "qa_report.json")];
  const refinePrereqExists = await Promise.all(refinePrereq.map(exists));
  const refineMissing: string[] = [];
  if (!refinePrereqExists[0]) refineMissing.push("script_final.md");
  if (!refinePrereqExists[1]) refineMissing.push("qa_report.json");
  const refineEnabled = refineExists || refineMissing.length === 0;

  const status: Record<PromptStep, PromptStatus> = {
    prompt_generate_prompt_content: { step: "prompt_generate_prompt_content", exists: metaExists, enabled: true, reason: null },
    script_qa: {
      step: "script_qa",
      exists: qaExists,
      enabled: qaEnabled,
      reason: qaEnabled ? null : `Missing prerequisites: ${qaMissing.join(", ")}`,
    },
    script_refine: {
      step: "script_refine",
      exists: refineExists,
      enabled: refineEnabled,
      reason: refineEnabled ? null : `Missing prerequisites: ${refineMissing.join(", ")}`,
    },
    script_segments_generate: {
      step: "script_segments_generate",
      exists: refineExists,
      enabled: refineEnabled,
      reason: refineEnabled ? null : `Missing prerequisites: ${refineMissing.join(", ")}`,
    },
  };

  return { ok: true, status };
}

export async function getPromptContent(projectId: string, step?: string, index?: number) {
  safeProjectId(projectId);


  const s: PromptStep =
    step === "script_qa" ? "script_qa" :
      step === "script_refine" ? "script_refine" :
        step === "script_segments_generate" ? "script_segments_generate" :
          "prompt_generate_prompt_content";

  // const p = promptFilePath(projectId, s);
  let text = '';
  if (s === "prompt_generate_prompt_content") {
    text = await buildMetadataGeneratePrompt(projectId);
  }
  if (s === "script_qa") {
    text = await buildScriptQAPrompt(projectId);
  }

  if (s === "script_refine") {
    text = await buildScriptRefinePrompt(projectId);
  }
  if (s === "script_segments_generate") {
    text = await buildSegmentsGeneratePrompt(projectId, index);
  }

  if (!text) throw new BadRequestException(`Prompt file not found for step: ${s}`);

  return { ok: true, step: s, content: text };
}
