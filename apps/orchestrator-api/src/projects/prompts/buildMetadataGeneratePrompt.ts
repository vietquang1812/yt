import { prisma } from "@yt-ai/db";
import { resolveConfigDir } from "../utils/paths";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { renderTemplate } from "../utils/template";
import { toChatGPTFormat } from "../utils/promptFormat";
import { loadSeriesContext } from "./seriesContext";

export async function buildMetadataGeneratePrompt(projectId: string) {
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

  const series = project.seriesId
    ? await prisma.series.findUnique({
      where: { id: project.seriesId },
      include: { memory: true },
    })
    : null;


  const prompts = await prisma.channelPrompt.findMany({
    where: {
      channelId: channel.id,
    }
  })

  const prompt = prompts.find(p => p.name === "prompt_generate_prompt_content");

  const personaYaml = channel.persona || await fs.readFile(path.join(cfgDir, "persona.yaml"), "utf8");
  const styleRulesYaml = channel.style_rules || await fs.readFile(path.join(cfgDir, "style_rules.yaml"), "utf8");
  const tmpl = prompt?.prompt || await fs.readFile(path.join(cfgDir, "prompts", "prompt_generate_prompt_content.md"), "utf8");
  const ctx = await loadSeriesContext(projectId);
  const user = renderTemplate(tmpl, {
    topic: project.topic || "Untitled topic",
    angle: project.pillar || "calm psychological reframe",
    length_chars: 0,
    persona_yaml: personaYaml,
    series_list: ctx.list.map(s => s.name).join('\n'),
    style_rules_yaml: styleRulesYaml,
    series_bible_json: JSON.stringify(series?.bible ?? {}, null, 2),
    series_memory_json: JSON.stringify(series?.memory?.memory ?? {}, null, 2),
    continuity_mode: project.continuityMode || "light",
  });

  const system = `You are a reliable content generator. Follow instructions strictly. Return exactly what the prompt requests.`;
  return toChatGPTFormat(system, user);
}