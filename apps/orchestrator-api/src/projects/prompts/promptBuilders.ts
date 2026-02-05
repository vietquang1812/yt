// apps/orchestrator-api/src/projects/prompts/promptBuilders.ts
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { prisma } from "@yt-ai/db";
import { renderTemplate } from "../utils/template";
import { toChatGPTFormat } from "../utils/promptFormat";
import { projectRootDir, resolveConfigDir } from "../utils/paths";
import { readIfExists } from "../utils/fs";

export async function buildMetadataGeneratePrompt(projectId: string) {
  const cfgDir = resolveConfigDir();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { series: true },
  });
  if (!project) throw new Error("Project not found");

  const series = project.seriesId
    ? await prisma.series.findUnique({
        where: { id: project.seriesId },
        include: { memory: true },
      })
    : null;

  const personaYaml = await fs.readFile(path.join(cfgDir, "persona.yaml"), "utf8");
  const styleRulesYaml = await fs.readFile(path.join(cfgDir, "style_rules.yaml"), "utf8");
  const tmpl = await fs.readFile(path.join(cfgDir, "prompts", "content_pack_generate.md"), "utf8");

  const user = renderTemplate(tmpl, {
    topic: project.topic || "Untitled topic",
    angle: project.pillar || "calm psychological reframe",
    length_chars: 0,
    persona_yaml: personaYaml,
    style_rules_yaml: styleRulesYaml,
    series_bible_json: JSON.stringify(series?.bible ?? {}, null, 2),
    series_memory_json: JSON.stringify(series?.memory?.memory ?? {}, null, 2),
    continuity_mode: project.continuityMode || "light",
  });

  const system = `You are a reliable content generator. Follow instructions strictly. Return exactly what the prompt requests.`;
  return toChatGPTFormat(system, user);
}

export async function buildScriptQAPrompt(projectId: string) {
  const cfgDir = resolveConfigDir();
  const root = projectRootDir(projectId);

  const scriptPath = path.join(root, "script_final.md");
  const metaPath = path.join(root, "metadata.json");
  const ideasPath = path.join(root, "next_ideas.json");

  const [scriptText, metadataText, nextIdeasText] = await Promise.all([
    readIfExists(scriptPath),
    readIfExists(metaPath),
    readIfExists(ideasPath),
  ]);

  const missing: string[] = [];
  if (!scriptText) missing.push("script_final.md");
  if (!metadataText) missing.push("metadata.json");
  if (!nextIdeasText) missing.push("next_ideas.json");

  if (missing.length > 0) return { ok: false as const, missing };

  const tmpl = await fs.readFile(path.join(cfgDir, "prompts", "script_qa.md"), "utf8");
  const user = renderTemplate(tmpl, {
    script_text: scriptText,
    metadata_json: metadataText,
    next_ideas_json: nextIdeasText,
    topic_hint: "",
  });

  const system = `You are a strict QA reviewer for YouTube scripts. Follow the rubric. Return exactly what the prompt requests.`;
  return { ok: true as const, prompt: toChatGPTFormat(system, user) };
}
