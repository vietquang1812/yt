// apps/orchestrator-api/src/projects/projects.service.ts
import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma, ProjectStatus, ArtifactType } from "@yt-ai/db";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import { CreateProjectDto, PromptStep, PromptStatus } from "./types";
import { TEXT_ARTIFACT_TYPES, ALLOWED_PREVIEW_STEPS } from "./constants";
import { exists, readIfExists, ensureDir } from "./utils/fs";
import { safeProjectId, promptFilePath, projectRootDir } from "./utils/paths";
import { buildMetadataGeneratePrompt, buildScriptQAPrompt } from "./prompts/promptBuilders";
import { loadSeriesContext } from "./prompts/seriesContext";
import { renderTemplate } from "./utils/template";
import { toChatGPTFormat } from "./utils/promptFormat";
import { loadPrompt, loadConfigText } from "./prompts/promptLoader";

@Injectable()
export class ProjectsService {
  async list() {
    return prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, topic: true, status: true, createdAt: true },
    });
  }

  async updateStatus(id: string, status: ProjectStatus) {
    const allowed = new Set<ProjectStatus>([
      ProjectStatus.IDEA_SELECTED,
      ProjectStatus.SCENES_PLANNED,
      ProjectStatus.VIDEO_RENDERED,
      ProjectStatus.PUBLISHED,
    ]);
    if (!allowed.has(status)) {
      throw new BadRequestException(`Invalid status for manual update: ${status}`);
    }
    return prisma.project.update({ where: { id }, data: { status } });
  }

  async create(dto: CreateProjectDto) {
    if (!dto.topic || !dto.topic.trim()) throw new BadRequestException("topic is required");

    let seriesId: string | null = dto.seriesId ?? null;
    if (seriesId) {
      const series = await prisma.series.findUnique({ where: { id: seriesId } });
      if (!series) throw new BadRequestException("seriesId not found");
      if ((series as any).disabled) {
        throw new BadRequestException("series is disabled; cannot be used for new projects");
      }
    }

    return prisma.project.create({
      data: {
        topic: dto.topic.trim(),
        language: dto.language ?? "en",
        durationMinutes: dto.durationMinutes ?? 6,
        format: dto.format ?? "youtube_long",
        tone: dto.tone,
        pillar: dto.pillar,
        status: ProjectStatus.IDEA_SELECTED,
        seriesId,
        continuityMode: dto.continuityMode ?? "light",
      },
    });
  }

  async get(id: string) {
    const p = await prisma.project.findUnique({
      where: { id },
      include: { artifacts: true, jobs: true, analytics: true, series: true },
    });
    if (!p) throw new NotFoundException("Project not found");
    return p;
  }

  async listArtifacts(projectId: string) {
    return prisma.artifact.findMany({ where: { projectId }, orderBy: { createdAt: "asc" } });
  }

  async getArtifactContent(artifactId: string) {
    const artifact = await prisma.artifact.findUnique({ where: { id: artifactId } });
    if (!artifact) throw new NotFoundException("Artifact not found");

    const buf = await fs.readFile(artifact.uri);

    if (TEXT_ARTIFACT_TYPES.has(artifact.type)) {
      return { id: artifact.id, type: artifact.type, content: buf.toString("utf8") };
    }
    return { id: artifact.id, type: artifact.type, base64: buf.toString("base64") };
  }

  // Giữ nguyên logic previewPrompt (nếu bạn muốn, ta có thể tách tiếp phần build per-step ra một module)
  async previewPrompt(projectId: string, step: string) {
    if (!ALLOWED_PREVIEW_STEPS.has(step)) {
      return { ok: false, error: `Unsupported step: ${step}` };
    }

    const ctx = await loadSeriesContext(projectId);

    let promptText = "";
    if (step === "metadata_generate") {
      const tmpl = await loadPrompt("content_pack_generate");
      const personaYaml = await loadConfigText("persona.yaml");
      const styleRulesYaml = await loadConfigText("style_rules.yaml");

      const user = renderTemplate(tmpl, {
        topic: ctx.project.topic || "Untitled topic",
        angle: ctx.project.pillar || "calm psychological reframe",
        length_chars: 0,
        persona_yaml: personaYaml,
        style_rules_yaml: styleRulesYaml,
        series_bible_json: JSON.stringify(ctx.seriesBible ?? {}, null, 2),
        series_memory_json: JSON.stringify(ctx.seriesMemory ?? {}, null, 2),
        continuity_mode: ctx.continuityMode,
      });

      const system = `You are a reliable content generator. Follow instructions strictly. Return exactly what the prompt requests.`;
      promptText = toChatGPTFormat(system, user);
    }

    const relFilename = path.posix.join(projectId, "prompts", `${step}.txt`);
    const root = projectRootDir(projectId);
    const absPath = path.join(root, "prompts", `${step}.txt`);

    await fs.mkdir(path.dirname(absPath), { recursive: true });
    await fs.writeFile(absPath, promptText, "utf8");

    const art = await prisma.artifact.create({
      data: {
        projectId,
        type: ArtifactType.LLM_PROMPT_TEXT,
        filename: relFilename,
        uri: absPath,
        meta: { step, preview: true, createdAtISO: new Date().toISOString() },
      },
    });

    return { ok: true, artifactId: art.id, filename: relFilename };
  }

  async getPromptStatus(projectId: string) {
    safeProjectId(projectId);

    const metaPath = promptFilePath(projectId, "metadata_generate");
    const metaExists = await exists(metaPath);

    const qaPath = promptFilePath(projectId, "script_qa");
    const qaExists = await exists(qaPath);

    const root = projectRootDir(projectId);
    const prereqPaths = [
      path.join(root, "script_final.md"),
      path.join(root, "metadata.json"),
      path.join(root, "next_ideas.json"),
    ];

    const prereqExists = await Promise.all(prereqPaths.map(exists));
    const missing: string[] = [];
    if (!prereqExists[0]) missing.push("script_final.md");
    if (!prereqExists[1]) missing.push("metadata.json");
    if (!prereqExists[2]) missing.push("next_ideas.json");

    const qaEnabled = qaExists || missing.length === 0;

    const status: Record<PromptStep, PromptStatus> = {
      metadata_generate: { step: "metadata_generate", exists: metaExists, enabled: true, reason: null },
      script_qa: {
        step: "script_qa",
        exists: qaExists,
        enabled: qaEnabled,
        reason: qaEnabled ? null : `Missing prerequisites: ${missing.join(", ")}`,
      },
    };

    return { ok: true, status };
  }

  async getPromptContent(projectId: string, step?: string) {
    safeProjectId(projectId);
    const s = (step === "script_qa" ? "script_qa" : "metadata_generate") as PromptStep;

    const p = promptFilePath(projectId, s);
    const text = await readIfExists(p);
    if (!text) throw new NotFoundException(`Prompt file not found for step: ${s}`);

    return { ok: true, step: s, content: text };
  }

  async ensurePrompt(projectId: string, step?: string) {
    safeProjectId(projectId);
    const s = (step === "script_qa" ? "script_qa" : "metadata_generate") as PromptStep;

    const promptPath = promptFilePath(projectId, s);
    await ensureDir(path.dirname(promptPath));

    if (await exists(promptPath)) return { ok: true, step: s, enabled: true, created: false };

    if (s === "metadata_generate") {
      const prompt = await buildMetadataGeneratePrompt(projectId);
      await fs.writeFile(promptPath, prompt, "utf8");
      return { ok: true, step: s, enabled: true, created: true };
    }

    if (s === "script_qa") {
      const built = await buildScriptQAPrompt(projectId);
      if (!built.ok) {
        return { ok: true, step: s, enabled: false, created: false, reason: `Missing prerequisites: ${built.missing.join(", ")}` };
      }
      await fs.writeFile(promptPath, built.prompt, "utf8");
      return { ok: true, step: s, enabled: true, created: true };
    }

    return { ok: false, error: `Unsupported step: ${s}` };
  }
}
