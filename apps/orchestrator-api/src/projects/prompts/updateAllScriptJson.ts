import { ArtifactType, prisma } from "@yt-ai/db";
import {safeProjectId } from "../utils/paths";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { validateScriptPack } from "../validators/scriptPack";
import { saveScriptAndMeta } from "../functions/artifacts";
import { saveArtifact } from "../lib/artifacts";

export async function updateAllScriptJson(projectId: string, data: any) {
    safeProjectId(projectId);

    const p = await prisma.project.findUnique({ where: { id: projectId } });
    if (!p) throw new NotFoundException("Project not found");

    // validate: phải là object/array JSON hợp lệ
    if (data === null || data === undefined) {
        throw new BadRequestException("Body must be a JSON object/array");
    }
    if (typeof data !== "object") {
    throw new BadRequestException("Body must be JSON (object/array), not a primitive");
  }

    let pack = validateScriptPack(data);

    await saveScriptAndMeta(projectId, pack, "metadata_generate");

    if (pack.next_ideas && pack.next_ideas.length > 0) {
        await saveArtifact({
            projectId,
            type: ArtifactType.NEXT_IDEAS_JSON,
            filename: "next_ideas.json",
            content: Buffer.from(JSON.stringify(pack.next_ideas, null, 2), "utf8"),
            meta: { step: "metadata_generate" },
        });
    }

    return { ok: true, saved: true };
}