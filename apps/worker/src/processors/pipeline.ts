import { Job } from "bullmq";
import { prisma, ArtifactType } from "@yt-ai/db";
import { loadPrompt, loadConfigText } from "../lib/promptLoader";
import { renderTemplate } from "../lib/template";
import { llmComplete } from "../lib/llmClient";
import { saveArtifact } from "../lib/artifacts";
import fs from "node:fs/promises";

type PipelineStep = "metadata_generate" | "script_refine" | "script_qa" | "thumbnail_generate" | "script_segments_generate";

async function setProgress(job: Job, value: number, msg?: string) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  await job.updateProgress(msg ? { value: v, msg } : v);
}

async function loadSeriesContext(projectId: string) {
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

  const seriesBible = series?.bible ?? null;
  const seriesMemory = series?.memory?.memory ?? null;

  return {
    continuityMode: project.continuityMode || "light",
    seriesBible,
    seriesMemory,
    seriesId: project.seriesId ?? null,
  };
}

async function readArtifactTextByUri(uri: string) {
  const buf = await fs.readFile(uri);
  return buf.toString("utf8");
}

async function upsertSeriesMemory(seriesId: string, memory: any) {
  await prisma.seriesMemory.upsert({
    where: { seriesId },
    create: { seriesId, memory },
    update: { memory },
  });
}


function countWords(text: string) {
  const cleaned = (text || "").trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).length;
}

// --- MVP repetition check (adjacent parts) ---
function normalizeForCompare(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s.!?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function splitSentences(s: string) {
  const t = normalizeForCompare(s);
  return t
    .split(/[.!?]+/g)
    .map(x => x.trim())
    .filter(Boolean)
    .filter(x => x.length >= 20);
}
function sentenceOverlapRatio(a: string, b: string) {
  const sa = new Set(splitSentences(a));
  const sb = new Set(splitSentences(b));
  if (sa.size === 0 || sb.size === 0) return 0;

  let inter = 0;
  for (const x of sa) if (sb.has(x)) inter++;

  const minSize = Math.min(sa.size, sb.size);
  return inter / minSize;
}

function validateScriptPack(pack: any) {
  if (!pack || typeof pack !== "object") throw new Error("invalid JSON object");
  if (!Array.isArray(pack.parts)) throw new Error("missing `parts` array");
  if (pack.parts.length < 1 || pack.parts.length > 6) {
    throw new Error("parts length must be 1..6");
  }

  let total = 0;
  for (const p of pack.parts) {
    if (!p || typeof p !== "object") throw new Error("invalid part object");
    if (typeof p.part !== "number") throw new Error("part.part must be number");
    if (typeof p.word_count !== "number") throw new Error("part.word_count must be number");
    if (typeof p.content !== "string") throw new Error("part.content must be string");

    const wc = countWords(p.content);
    total += wc;

    if (Math.abs(wc - p.word_count) > Math.max(120, p.word_count * 0.2)) {
      throw new Error(`part ${p.part} word_count mismatch (reported ${p.word_count}, actual ${wc})`);
    }
  }

  if (total < 3000 || total > 5000) {
    throw new Error(`total word count out of range (actual ${total})`);
  }

  for (let i = 1; i < pack.parts.length; i++) {
    const prev = pack.parts[i - 1]?.content || "";
    const curr = pack.parts[i]?.content || "";
    const ratio = sentenceOverlapRatio(prev, curr);
    if (ratio > 0.35) {
      throw new Error(`repetitive content detected between part ${i} and ${i + 1} (overlap ${ratio.toFixed(2)})`);
    }
  }

  if (pack.compliance && typeof pack.compliance === "object") {
    const requiredFlags = [
      "youtube_safe",
      "us_law_safe",
      "no_hate",
      "no_illegal_instructions",
      "no_graphic_violence",
      "no_explicit_sexual_content",
      "no_repetition",
    ] as const;

    for (const k of requiredFlags) {
      if (pack.compliance[k] !== true) {
        throw new Error(`compliance flag ${k} must be true`);
      }
    }
  }

  pack.total_word_count = total;
  return pack;
}

async function getLatestArtifact(projectId: string, type: ArtifactType) {
  return prisma.artifact.findFirst({
    where: { projectId, type },
    orderBy: { createdAt: "desc" },
  });
}

async function saveScriptAndMeta(projectId: string, pack: any, metaStep: string) {
  const scriptFinal = pack.parts.map((p: any) => (p.content || "").trim()).join("\n\n");

  await saveArtifact({
    projectId,
    type: ArtifactType.SCRIPT_FINAL_MD,
    filename: "script_final.md",
    content: Buffer.from(scriptFinal, "utf8"),
    meta: {
      step: metaStep,
      total_word_count: pack.total_word_count,
      parts: pack.parts.map((p: any) => ({ part: p.part, word_count: p.word_count, role: p.role }))
    }
  });

  const meta = {
    channel: pack.channel || "Simple Mind Studio",
    format: pack.format || "faceless_storytelling",
    total_word_count: pack.total_word_count,
    parts: pack.parts.map((p: any) => ({
      part: p.part,
      role: p.role,
      word_count: p.word_count
    })),
    compliance: pack.compliance || {}
  };

  await saveArtifact({
    projectId,
    type: ArtifactType.METADATA_JSON,
    filename: "metadata.json",
    content: Buffer.from(JSON.stringify(meta, null, 2), "utf8"),
    meta: { step: metaStep }
  });
}

export async function handlePipelineJob(job: Job<any>) {
  const step = job.name as PipelineStep;
  const { projectId } = job.data as { projectId: string; meta?: any };

  await setProgress(job, 1, "starting");

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error(`Project not found: ${projectId}`);

  // -------------------------
  // STEP: metadata_generate
  // -------------------------
  if (step === "metadata_generate") {
    await setProgress(job, 10, "loading prompt + configs");

    const tmpl = await loadPrompt("content_pack_generate");
    const personaYaml = await loadConfigText("persona.yaml");
    const styleRulesYaml = await loadConfigText("style_rules.yaml");
    const ctx = await loadSeriesContext(projectId);
    const prompt = renderTemplate(tmpl, {
      topic: project.topic || "Untitled topic",
      angle: project.pillar || "calm psychological reframe",
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

    await setProgress(job, 75, "saving artifacts");
    await saveScriptAndMeta(projectId, pack, "metadata_generate");

    // scenes optional
    const scenes = Array.isArray(pack.scenes) ? pack.scenes : [];
    await saveArtifact({
      projectId,
      type: ArtifactType.SCENE_PLAN_JSON,
      filename: "scene_plan.json",
      content: Buffer.from(JSON.stringify(scenes, null, 2), "utf8"),
      meta: { step: "metadata_generate" }
    });

    await setProgress(job, 100, "done");
    return;
  }

  if (step === "script_segments_generate") {
    await setProgress(job, 10, "loading latest script + character");

    const scriptArt = await getLatestArtifact(projectId, ArtifactType.SCRIPT_FINAL_MD);
    if (!scriptArt) throw new Error("script_segments_generate: missing SCRIPT_FINAL_MD");

    const scriptText = await readArtifactTextByUri(scriptArt.uri);

    const tmpl = await loadPrompt("script_segments_generate");
    const characterYaml = await loadConfigText("character.yaml");

    // Extract face_lock phrase from yaml crudely (simple MVP)
    const faceLockPhrase = "same face as reference character, identical facial features";

    const prompt = renderTemplate(tmpl, {
      script_text: scriptText,
      character_yaml: characterYaml,
      face_lock_phrase: faceLockPhrase
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
      meta: { step: "script_segments_generate", sourceScriptArtifactId: scriptArt.id }
    });

    await setProgress(job, 100, "done");
    return;
  }


  // -------------------------
  // STEP: script_refine (manual trigger)
  // -------------------------
  if (step === "script_refine") {
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
      const nextMemory = {
        updatedAt: new Date().toISOString(),
        last_project_id: projectId,
        last_topic: project.topic,
        // gợi ý: lấy từ report nếu bạn đã tạo report.suggested_fixes/open_loops
        // qa_summary: report.summary ?? "",
        // open_loops: report.open_loops ?? [],
        // callbacks_used: report.callbacks_used ?? [],
        // motifs: report.motifs ?? []
      };
      await upsertSeriesMemory(ctx.seriesId, nextMemory);
    }
    const refinePrompt = renderTemplate(refineTmpl, {
      topic: project.topic || "Untitled topic",
      angle: project.pillar || "calm psychological reframe",
      script_text: scriptText,
      qa_report_json: qaReportText
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

    await setProgress(job, 100, "refined");
    return;
  }

  // -------------------------
  // STEP: script_qa
  // -------------------------
  if (step === "script_qa") {
    await setProgress(job, 10, "loading latest script");

    const scriptArtifact = await getLatestArtifact(projectId, ArtifactType.SCRIPT_FINAL_MD);
    if (!scriptArtifact?.uri) {
      throw new Error("script_qa: missing SCRIPT_FINAL_MD artifact. Run metadata_generate first.");
    }

    const scriptText = await fs.readFile(scriptArtifact.uri, "utf8");

    await setProgress(job, 30, "loading qa prompt");
    const qaTmpl = await loadPrompt("script_qa");

    const qaPrompt = renderTemplate(qaTmpl, {
      topic: project.topic || "Untitled topic",
      angle: project.pillar || "calm psychological reframe",
      script_text: scriptText
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
      meta: { step: "script_qa" }
    });

    if (report?.approved !== true) {
      throw new Error("script_qa: NOT APPROVED (see qa_report.json for details)");
    }

    await setProgress(job, 100, "approved");
    return;
  }

  if (step === "thumbnail_generate") {
    await setProgress(job, 100, "skipped (not implemented)");
    return;
  }

  await setProgress(job, 100, "done (unknown step)");
}



