import { prisma } from "@yt-ai/db";
import { readIfExists } from "../utils/fs";
import { projectRootDir, resolveConfigDir } from "../utils/paths";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { loadConfigText } from "./promptLoader";
import { loadSeriesContext } from "./seriesContext";
import { renderTemplate } from "../utils/template";
import { toChatGPTFormat } from "../utils/promptFormat";
import { parsePromptPack } from "../functions/parsePromptPack";
import { BadRequestException } from "@nestjs/common";

export async function buildScriptRefinePrompt(projectId: string) {
    const cfgDir = resolveConfigDir();
    const root = projectRootDir(projectId);


    const missing: string[] = [];
    if (missing.length > 0) return '';

    const tmpl = await fs.readFile(path.join(cfgDir, "prompts", "script_refine.md"), "utf8");
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error(`Project not found: ${projectId}`);

    const personaYaml = await loadConfigText("persona.yaml");
    const styleRulesYaml = await loadConfigText("style_rules.yaml");
    const ctx = await loadSeriesContext(projectId);
    const pack = parsePromptPack(project.prompt_pack_json);
    if (!pack?.parts?.length) {
        throw new BadRequestException("Prompt pack not found");
    }
    const scriptText = JSON.stringify(pack.parts, null, 2)
    const qaReportText = JSON.stringify(project.qa_json, null, 2)
    const user = renderTemplate(tmpl, {
        topic: project.topic,
        angle: project.pillar,
        script_text: scriptText,
        qa_report_json: qaReportText,
        persona_yaml: personaYaml,
        style_rules_yaml: styleRulesYaml,

        series_bible_json: JSON.stringify(ctx.seriesBible ?? {}, null, 2),
        series_memory_json: JSON.stringify(ctx.seriesMemory ?? {}, null, 2),
        continuity_mode: ctx.continuityMode,
    });

    const system = `You are a precise script editor. Apply the QA report. Improve clarity and structure. Return exactly what the prompt requests.`;
    return toChatGPTFormat(system, user);
}