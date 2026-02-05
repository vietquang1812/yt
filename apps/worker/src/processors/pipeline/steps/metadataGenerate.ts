import type { Job } from "bullmq";
import type { Project } from "@yt-ai/db";
import { ArtifactType, ProjectStatus } from "@yt-ai/db";

import { loadPrompt, loadConfigText } from "../../../lib/promptLoader";
import { renderTemplate } from "../../../lib/template";
import { llmComplete } from "../../../lib/llmClient";
import { saveArtifact } from "../../../lib/artifacts";

import { setProgress } from "../progress";
import { setProjectStatus } from "../status";
import { loadSeriesContext } from "../seriesContext";
import { saveScriptAndMeta } from "../artifacts";
import { validateScriptPack } from "../validators/scriptPack";
import { validateNextIdeas } from "../validators/nextIdeas";

export async function handleMetadataGenerate(job: Job, project: Project) {
  const projectId = project.id;

  await setProgress(job, 10, "loading prompt + configs");

  const tmpl = await loadPrompt("content_pack_generate");
  const personaYaml = await loadConfigText("persona.yaml");
  const styleRulesYaml = await loadConfigText("style_rules.yaml");
  const ctx = await loadSeriesContext(projectId);

  const prompt = renderTemplate(tmpl, {
    topic: project.topic || "Untitled topic",
    angle: project.pillar || "calm psychological reframe",
    main_tone: project.tone,
    length_chars: 0,
    persona_yaml: personaYaml,
    style_rules_yaml: styleRulesYaml,
    series_bible_json: JSON.stringify(ctx.seriesBible ?? {}, null, 2),
    series_memory_json: JSON.stringify(ctx.seriesMemory ?? {}, null, 2),
    continuity_mode: ctx.continuityMode,
  });

  await setProgress(job, 40, "calling llm");
  const resp = await llmComplete(prompt);

  let pack: any;
  try {
    pack = JSON.parse(resp.text);
  } catch {
    throw new Error("metadata_generate: model did not return valid JSON");
  }

  await setProgress(job, 55, "validating content constraints");
  pack = validateScriptPack(pack);
  validateNextIdeas(pack.next_ideas, project.continuityMode || "light");

  await setProgress(job, 75, "saving artifacts");
  await saveScriptAndMeta(projectId, pack, "metadata_generate");

  const scenes = Array.isArray(pack.scenes) ? pack.scenes : [];
  await saveArtifact({
    projectId,
    type: ArtifactType.SCENE_PLAN_JSON,
    filename: "scene_plan.json",
    content: Buffer.from(JSON.stringify(scenes, null, 2), "utf8"),
    meta: { step: "metadata_generate" },
  });

  await saveArtifact({
    projectId,
    type: ArtifactType.NEXT_IDEAS_JSON,
    filename: "next_ideas.json",
    content: Buffer.from(JSON.stringify(pack.next_ideas, null, 2), "utf8"),
    meta: { step: "metadata_generate" },
  });

  await setProjectStatus(projectId, ProjectStatus.METADATA_READY);
  await setProgress(job, 100, "done");
}
