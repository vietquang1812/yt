import { prisma } from "@yt-ai/db";
import { safeProjectId } from "../utils/paths";
import { BadRequestException, NotFoundException } from "@nestjs/common";

export async function updateScriptQaJSON(projectId: string, data: any) {
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

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project?.prompt_pack_json) {
      throw new BadRequestException('Prompt pack not found');
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        qa_json: data,
      },
    });
    
}