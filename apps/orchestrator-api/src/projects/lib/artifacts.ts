import { ArtifactStorage } from "@yt-ai/common";
import { prisma, ArtifactType } from "@yt-ai/db";

const storage = new ArtifactStorage(
    (process.env.STORAGE_DRIVER as "local") || "local",
    process.env.STORAGE_DIR || "storage/projects"
);

export async function saveArtifact(params: {
    projectId: string;
    type: ArtifactType;
    filename: string;
    content: string | Buffer;
    meta?: Record<string, any>;
}) {
    const data = Buffer.isBuffer(params.content)
        ? params.content
        : Buffer.from(params.content, "utf8");

    const put = await storage.put(params.projectId, params.filename, data);

    return prisma.artifact.create({
        data: {
            filename: params.filename,
            projectId: params.projectId,
            type: params.type,
            uri: put.uri,
            meta: { ...(params.meta || {}), ...(put.meta || {}) },
        },
    });
}
