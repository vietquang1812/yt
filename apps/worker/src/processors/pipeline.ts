import { Job } from "bullmq";
import { prisma, ArtifactType } from "@yt-ai/db";
import { loadPrompt, loadConfigText } from "../lib/promptLoader";
import { renderTemplate } from "../lib/template";
import { llmComplete } from "../lib/llmClient";
import { saveArtifact } from "../lib/artifacts";

type PipelineStep = "metadata_generate" | "thumbnail_generate";

async function setProgress(job: Job, value: number, msg?: string) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  await job.updateProgress(msg ? { value: v, msg } : v);
}

function countWords(text: string) {
  const cleaned = (text || "").trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).length;
}

/**
 * MVP repetition check:
 * - normalize text
 * - compare overlap ratio of unique sentences
 * Nếu overlap quá cao -> coi như lặp.
 * (Đủ dùng để chặn “nhai lại” giữa các phần, không cần thêm dependency)
 */
function normalizeForCompare(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s.!?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitSentences(s: string) {
  const t = normalizeForCompare(s);
  // tách theo . ! ? (đơn giản)
  return t
    .split(/[.!?]+/g)
    .map(x => x.trim())
    .filter(Boolean)
    .filter(x => x.length >= 20); // bỏ câu quá ngắn (noise)
}

function sentenceOverlapRatio(a: string, b: string) {
  const sa = new Set(splitSentences(a));
  const sb = new Set(splitSentences(b));
  if (sa.size === 0 || sb.size === 0) return 0;

  let inter = 0;
  for (const x of sa) if (sb.has(x)) inter++;

  const minSize = Math.min(sa.size, sb.size);
  return inter / minSize; // 0..1
}

function validateScriptPack(pack: any) {
  if (!pack || typeof pack !== "object") throw new Error("metadata_generate: invalid JSON object");

  if (!Array.isArray(pack.parts)) throw new Error("metadata_generate: missing `parts` array");

  if (pack.parts.length < 1 || pack.parts.length > 6) {
    throw new Error("metadata_generate: parts length must be 1..6");
  }

  // validate each part
  let total = 0;
  for (const p of pack.parts) {
    if (!p || typeof p !== "object") throw new Error("metadata_generate: invalid part object");
    if (typeof p.part !== "number") throw new Error("metadata_generate: part.part must be number");
    if (typeof p.word_count !== "number") throw new Error("metadata_generate: part.word_count must be number");
    if (typeof p.content !== "string") throw new Error("metadata_generate: part.content must be string");

    const wc = countWords(p.content);
    total += wc;

    // soft check: model reported word_count should be close
    if (Math.abs(wc - p.word_count) > Math.max(120, p.word_count * 0.2)) {
      throw new Error(`metadata_generate: part ${p.part} word_count mismatch (reported ${p.word_count}, actual ${wc})`);
    }
  }

  if (total < 3000 || total > 5000) {
    throw new Error(`metadata_generate: total word count out of range (actual ${total})`);
  }

  // repetition check between adjacent parts (MVP)
  for (let i = 1; i < pack.parts.length; i++) {
    const prev = pack.parts[i - 1]?.content || "";
    const curr = pack.parts[i]?.content || "";
    const ratio = sentenceOverlapRatio(prev, curr);
    if (ratio > 0.35) {
      throw new Error(`metadata_generate: repetitive content detected between part ${i} and ${i + 1} (overlap ${ratio.toFixed(2)})`);
    }
  }

  // compliance flags: if present, must be true
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
        throw new Error(`metadata_generate: compliance flag ${k} must be true`);
      }
    }
  }

  // add computed total
  pack.total_word_count = total;
  return pack;
}

export async function handlePipelineJob(job: Job<any>) {
  const step = job.name as PipelineStep; // BullMQ job.name = step
  const { projectId } = job.data as { projectId: string; meta?: any };

  await setProgress(job, 1, "starting");

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error(`Project not found: ${projectId}`);

  if (step === "metadata_generate") {
    await setProgress(job, 10, "loading prompt + configs");

    const tmpl = await loadPrompt("content_pack_generate");
    const personaYaml = await loadConfigText("persona.yaml");
    const styleRulesYaml = await loadConfigText("style_rules.yaml");

    // NOTE: prompt yêu cầu 3000-5000 words, nên length_chars không còn quan trọng
    const prompt = renderTemplate(tmpl, {
      topic: project.topic || "Untitled topic",
      angle: project.pillar || "calm psychological reframe",
      length_chars: 0,
      persona_yaml: personaYaml,
      style_rules_yaml: styleRulesYaml
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

    // Build final script as continuous narrative across parts
    const scriptFinal = pack.parts.map((p: any) => (p.content || "").trim()).join("\n\n");

    // 1) Script final
    await saveArtifact({
      projectId,
      type: ArtifactType.SCRIPT_FINAL_MD,
      filename: "script_final.md",
      content: Buffer.from(scriptFinal, "utf8"),
      meta: {
        step: "metadata_generate",
        total_word_count: pack.total_word_count,
        parts: pack.parts.map((p: any) => ({ part: p.part, word_count: p.word_count, role: p.role }))
      }
    });

    // 2) Scene plan (optional) — nếu model không trả scenes thì lưu rỗng
    const scenes = Array.isArray(pack.scenes) ? pack.scenes : [];
    await saveArtifact({
      projectId,
      type: ArtifactType.SCENE_PLAN_JSON,
      filename: "scene_plan.json",
      content: Buffer.from(JSON.stringify(scenes, null, 2), "utf8"),
      meta: { step: "metadata_generate" }
    });

    // 3) Metadata: lưu cấu trúc parts + compliance để UI đọc
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
      meta: { step: "metadata_generate" }
    });

    await setProgress(job, 100, "done");
    return;
  }

  if (step === "thumbnail_generate") {
    await setProgress(job, 100, "skipped (not implemented)");
    return;
  }

  await setProgress(job, 100, "done (unknown step)");
}
