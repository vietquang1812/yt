import { prisma, ArtifactType } from "@yt-ai/db";
import * as fs from "node:fs/promises";
import { saveArtifact } from "../lib/artifacts";

export async function getLatestArtifact(projectId: string, type: ArtifactType) {
  return prisma.artifact.findFirst({
    where: { projectId, type },
    orderBy: { createdAt: "desc" },
  });
}

export async function readArtifactTextByUri(uri: string) {
  const buf = await fs.readFile(uri);
  return buf.toString("utf8");
}

export async function saveScriptAndMeta(projectId: string, pack: any, metaStep: string) {
  const scriptFinal = pack.parts.map((p: any) => (p.content || "").trim()).join("\n\n");

  await saveArtifact({
    projectId,
    type: ArtifactType.SCRIPT_FINAL_MD,
    filename: "script_final.md",
    content: Buffer.from(scriptFinal, "utf8"),
    meta: {
      step: metaStep,
      total_word_count: pack.total_word_count,
      parts: pack.parts.map((p: any) => ({
        part: p.part,
        real_count: p.real_count,
        word_count: p.word_count,
        role: p.role,
      })),
    },
  });

  const meta = {
    channel: pack.channel || "Simple Mind Studio",
    format: pack.format || "faceless_storytelling",
    total_word_count: pack.total_word_count,
    parts: pack.parts.map((p: any) => ({
      part: p.part,
      role: p.role,
      real_count: p.real_count,
      word_count: p.word_count,
    })),
    compliance: pack.compliance || {},
  };

  await saveArtifact({
    projectId,
    type: ArtifactType.METADATA_JSON,
    filename: "metadata.json",
    content: Buffer.from(JSON.stringify(meta, null, 2), "utf8"),
    meta: { step: metaStep },
  });
}
