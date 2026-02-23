import { prisma } from "@yt-ai/db";
import { resolveConfigDir } from "../utils/paths";
import * as fs from "node:fs/promises";
import { renderTemplate } from "../utils/template";
import * as path from "node:path";
import { toChatGPTFormat } from "../utils/promptFormat";
import { parsePromptPack } from "../functions/parsePromptPack";
import { BadRequestException } from "@nestjs/common";

export async function buildSegmentsGeneratePrompt(projectId: string, index?: number) {
    index = index ?? 0
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
    const tmpl = await fs.readFile(path.join(cfgDir, "prompts", "script_segments_generate.md"), "utf8");
    const characterYaml = await fs.readFile(path.join(cfgDir, "character.yaml"), "utf8");

    const pack = parsePromptPack(project.prompt_pack_json);
    if (!pack?.parts?.length) {
        throw new BadRequestException("Prompt pack not found");
    }

    const part =  pack.parts.find(x => x.part === index)
    const scriptText = part?.content
    const partRole = part?.role

    const user = renderTemplate(tmpl, {
        character_yaml: characterYaml,
        face_lock_phrase: "A cartoon character with a round, light-skinned face, simple black dot eyes, thin arched eyebrows, and a small, curved smile. He has short, dark brown hair styled in a simple, swept-back anime fashion with a few strands over his forehead. The art style is clean line drawing with flat colors, consistent with a simple animation or comic.",
        script_text: scriptText,
        part_number: index,
        part_role: partRole,
        topic: project.topic || "Untitled topic",
        angle: project.pillar || "calm psychological reframe",

        persona_yaml: personaYaml,
        style_rules_yaml: styleRulesYaml,
    });

    const system = `You are an expert AI video prompt creator. Your task is to generate high-quality video generation prompts based on user requests. Always integrate the provided face_lock_phrase to maintain character consistency. Clearly specify camera angles, lighting, motion, and environment. Follow instructions strictly and return exactly the formatted prompts requested.`;
    return toChatGPTFormat(system, user);
}