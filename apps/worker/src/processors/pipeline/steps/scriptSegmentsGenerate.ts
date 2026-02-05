import type { Job } from "bullmq";
import type { Project } from "@yt-ai/db";
import { ArtifactType, ProjectStatus } from "@yt-ai/db";

import { loadPrompt, loadConfigText } from "../../../lib/promptLoader";
import { renderTemplate } from "../../../lib/template";
import { llmComplete } from "../../../lib/llmClient";
import { saveArtifact } from "../../../lib/artifacts";

import { setProgress } from "../progress";
import { setProjectStatus } from "../status";
import { getLatestArtifact, readArtifactTextByUri } from "../artifacts";

export async function handleScriptSegmentsGenerate(job: Job, project: Project) {
  const projectId = project.id;

  await setProgress(job, 10, "loading latest script + character");

  const scriptArt = await getLatestArtifact(projectId, ArtifactType.SCRIPT_FINAL_MD);
  if (!scriptArt) throw new Error("script_segments_generate: missing SCRIPT_FINAL_MD");

  const scriptText = await readArtifactTextByUri(scriptArt.uri);

  const tmpl = await loadPrompt("script_segments_generate");
  const characterYaml = await loadConfigText("character.yaml");

  const faceLockPhrase = "same face as reference character, identical facial features";

  const prompt = renderTemplate(tmpl, {
    script_text: scriptText,
    character_yaml: characterYaml,
    face_lock_phrase: faceLockPhrase,
  });

  await setProgress(job, 45, "calling llm");
  const resp = await llmComplete(prompt);

  let out: any;
  try {
    out = JSON.parse(resp.text);
  } catch {
    throw new Error("script_segments_generate: model did not return valid JSON");
  }

  if (!Array.isArray(out?.segments)) {
    throw new Error("script_segments_generate: invalid JSON schema, missing segments[]");
  }

  await setProgress(job, 80, "saving script_segments.json");

  await saveArtifact({
    projectId,
    type: ArtifactType.SCRIPT_SEGMENTS_JSON,
    filename: "script_segments.json",
    content: Buffer.from(JSON.stringify(out, null, 2), "utf8"),
    meta: { step: "script_segments_generate", sourceScriptArtifactId: scriptArt.id },
  });

  // ✅ cần enum ProjectStatus.SCRIPT_SEGMENTS_READY trong schema
  await setProjectStatus(projectId, ProjectStatus.SCRIPT_SEGMENTS_READY);
  await setProgress(job, 100, "done");
}
