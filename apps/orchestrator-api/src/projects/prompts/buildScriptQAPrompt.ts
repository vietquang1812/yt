// apps/orchestrator-api/src/projects/prompts/promptBuilders.ts
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { prisma } from "@yt-ai/db";
import { renderTemplate } from "../utils/template";
import { toChatGPTFormat } from "../utils/promptFormat";
import { resolveConfigDir } from "../utils/paths";
import { parsePromptPack } from "../functions/parsePromptPack";
import { BadRequestException } from "@nestjs/common";


export async function buildScriptQAPrompt(projectId: string) {
    const cfgDir = resolveConfigDir();

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { series: true },
    });
    if (!project) throw new Error("Project not found");

    if (!project.channelId) throw new Error("Project channelId is not set");

    const channel = await prisma.channel.findUnique({
        where: { id: project.channelId },
    });

    if (!channel) throw new Error("Channel not found");


    const pack = parsePromptPack(project.prompt_pack_json);

    if (!pack?.parts?.length) {
        return '';
    }

    const prompts = await prisma.channelPrompt.findMany({
        where: {
            channelId: channel.id,
        }
    })

    const prompt = prompts.find(p => p.name === "script_qa");

    const tmpl = prompt?.prompt || await fs.readFile(path.join(cfgDir, "prompts", "script_qa.md"), "utf8");
    const scriptText = pack?.parts?.map(p => p.content).join('\n\n')
    const user = renderTemplate(tmpl, {
        script_text: scriptText,
        topic: project.topic,
        angle: project.pillar
    });

    const system = `You are a strict QA reviewer for YouTube scripts. Follow the rubric. Return exactly what the prompt requests.`;
    return toChatGPTFormat(system, user);
}

