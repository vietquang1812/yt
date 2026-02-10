// apps/orchestrator-api/src/projects/prompts/promptManager.ts
import * as fs from "node:fs/promises";
import * as path from "node:path";
import {  BadRequestException } from "@nestjs/common";
import { PromptStep, PromptStatus } from "../types";
import { exists, readIfExists, ensureDir } from "../utils/fs";
import { safeProjectId, promptFilePath, projectRootDir, promptProjectFileContent } from "../utils/paths";
import { buildMetadataGeneratePrompt, buildScriptQAPrompt, buildScriptRefinePrompt } from "./promptBuilders";

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
  };

  return { ok: true, status };
}

export async function getPromptContent(projectId: string, step?: string) {
  safeProjectId(projectId);

  const s: PromptStep =
    step === "script_qa" ? "script_qa" :
    step === "script_refine" ? "script_refine" :
    "prompt_generate_prompt_content";

  // const p = promptFilePath(projectId, s);
  let text = '';
  if (s === "prompt_generate_prompt_content") {
     text = await buildMetadataGeneratePrompt(projectId);

  }
  if (!text) throw new BadRequestException(`Prompt file not found for step: ${s}`);

  return { ok: true, step: s, content: text };
}

export async function ensurePrompt(projectId: string, step?: string) {
  safeProjectId(projectId);

  const s: PromptStep =
    step === "script_qa" ? "script_qa" :
    step === "script_refine" ? "script_refine" :
    "prompt_generate_prompt_content";

  const p = promptFilePath(projectId, s);
  await ensureDir(path.dirname(p));
  if (await exists(p)) return { ok: true, step: s, enabled: true, created: false };

  if (s === "prompt_generate_prompt_content") {
    const prompt = await buildMetadataGeneratePrompt(projectId);
    await fs.writeFile(p, prompt, "utf8"); 
    return { ok: true, step: s, enabled: true, created: true };
  }

  if (s === "script_qa") {
    const built = await buildScriptQAPrompt(projectId);
    if (!built.ok) {
      return { ok: true, step: s, enabled: false, created: false, reason: `Missing prerequisites: ${built.missing.join(", ")}` };
    }
    await fs.writeFile(p, built.prompt, "utf8");
    return { ok: true, step: s, enabled: true, created: true };
  }

  if (s === "script_refine") {
    const built = await buildScriptRefinePrompt(projectId);
    if (!built.ok) {
      return { ok: true, step: s, enabled: false, created: false, reason: `Missing prerequisites: ${built.missing.join(", ")}` };
    }
    await fs.writeFile(p, built.prompt, "utf8");
    return { ok: true, step: s, enabled: true, created: true };
  }

  return { ok: false, error: `Unsupported step: ${s}` };
}
