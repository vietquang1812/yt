import { BadRequestException, NotFoundException } from "@nestjs/common";
import { prisma } from "@yt-ai/db";
import { parsePromptPack } from "../functions/parsePromptPack";
import { loadConfigText, loadPrompt } from "./promptLoader";
import { loadSeriesContext } from "./seriesContext";
import { renderTemplate } from "../utils/template";
import { toChatGPTFormat } from "../utils/promptFormat";

export async function buildRegeneratePrompt(projectId: string, part: number) {
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
        part_role: partData.role,
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
    return promptText;
}