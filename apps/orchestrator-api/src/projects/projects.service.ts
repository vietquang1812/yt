// apps/orchestrator-api/src/projects/projects.service.ts
import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma, ProjectStatus, ArtifactType } from "@yt-ai/db";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import { CreateProjectDto } from "./types";
import { TEXT_ARTIFACT_TYPES, ALLOWED_PREVIEW_STEPS } from "./constants";
import { projectRootDir } from "./utils/paths";
import { loadSeriesContext } from "./prompts/seriesContext";
import { renderTemplate } from "./utils/template";
import { toChatGPTFormat } from "./utils/promptFormat";
import { loadPrompt, loadConfigText } from "./prompts/promptLoader";
import * as promptManager from "./prompts/promptManager";
import { validatePromptPack } from './validators/promptPack.validator';
import { updateScriptQaJSON } from "./prompts/updateScriptQaJSON";
import { parsePromptPack } from "./functions/parsePromptPack";


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

  async previewPrompt(projectId: string, step: string) {
    if (!ALLOWED_PREVIEW_STEPS.has(step)) {
      return { ok: false, error: `Unsupported step: ${step}` };
    }

    const ctx = await loadSeriesContext(projectId);
    let promptText = "";

    if (step === "prompt_generate_prompt_content") {
      const tmpl = await loadPrompt("prompt_generate_prompt_content");
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

    const root = projectRootDir(projectId);
    const relFilename = path.posix.join(projectId, "prompts", `${step}.txt`);
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

  // prompt-related APIs:
  async getPromptStatus(projectId: string) {
    return promptManager.getPromptStatus(projectId);
  }
  async getPromptContent(projectId: string, step?: string) {
    try {
      return await promptManager.getPromptContent(projectId, step);
    } catch (e: any) {
      throw new NotFoundException(e?.message || "Prompt not found");
    }
  }
  async ensurePrompt(projectId: string, step?: string) {
    return promptManager.ensurePrompt(projectId, step);
  }

  async updatePromptPack(projectId: string, promptPack: any) {
    validatePromptPack(promptPack);

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        prompt_pack_json: promptPack,
        prompt_pack_version: { increment: 1 },
        prompt_pack_updated_at: new Date(),
      },
    });

    return {
      success: true,
      version: project.prompt_pack_version,
    };
  }

  async updatePromptPackPartContent(
    projectId: string,
    part: number,
    content: string,
  ) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project?.prompt_pack_json) {
      throw new BadRequestException('Prompt pack not found');
    }

    const pack = project.prompt_pack_json as any;

    const target = pack.parts.find((p: any) => p.part === part);
    if (!target) {
      throw new BadRequestException(`Part ${part} not found`);
    }

    target.content = content;
    target.word_count = content.split(/\s+/).length;

    await prisma.project.update({
      where: { id: projectId },
      data: {
        prompt_pack_json: pack,
        prompt_pack_updated_at: new Date(),
      },
    });

    return { ok: true };
  }


  async buildRegeneratePrompt(projectId: string, part: number) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException("Project not found");
    const pack = parsePromptPack(project.prompt_pack_json);

    if (!pack?.parts?.length) {
      throw new BadRequestException("Prompt pack not found");
    }

    const partData = pack.parts.find((p) => p.part === part);
    if (!partData) {
      throw new BadRequestException(`Part ${part} not found`);
    }

    // Load prompt template
    const template = await loadPrompt("prompt_generate_content");
    const personaYaml = await loadConfigText("persona.yaml");
    const styleRulesYaml = await loadConfigText("style_rules.yaml");
    const ctx = await loadSeriesContext(projectId);
    let promptText = "";
    const user = renderTemplate(template, {
      topic: ctx.project.topic || "Untitled topic",
      angle: ctx.project.pillar || "calm psychological reframe",
      length_chars: 0,
      part_number: part,
      part_role:partData.role,
      target_words: partData.target_words,
      generation_prompt: partData.generation_prompt,
      persona_yaml: personaYaml,
      style_rules_yaml: styleRulesYaml,
      series_bible_json: JSON.stringify(ctx.seriesBible ?? {}, null, 2),
      series_memory_json: JSON.stringify(ctx.seriesMemory ?? {}, null, 2),
      continuity_mode: ctx.continuityMode,
    });
    const system = `You are a reliable content generator. Follow instructions strictly. Return exactly what the prompt requests.`;
    promptText = toChatGPTFormat(system, user);

    // const prompt = renderTemplate(template, {
    //   project,
    //   part: partData,
    // });
    return {
      ok: true,
      prompt:promptText,
    };
  }

  async updateScriptQaJSON(projectId: string, data: any) {
    await updateScriptQaJSON(projectId, data);
  }
}
