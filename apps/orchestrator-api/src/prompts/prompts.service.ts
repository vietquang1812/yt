import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma } from "@yt-ai/db";
import { CreatePromptDto, PromptDto } from "./type";


@Injectable()
export class PromptsService {
    async list() {
        return await prisma.channelPrompt.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                prompt: true,
                channelId: true,
                createdAt: true,
                updatedAt: true,
                channel: true
            },
        });
    }

    async create(prompt: CreatePromptDto) {
        return prisma.channelPrompt.create({
            data: {
                name: prompt.name,
                channelId: prompt.channelId,
                prompt: prompt.prompt ?? "",
            }
        });
    }

    async update(promptId: string, prompt: CreatePromptDto) {
        const existing = await prisma.channelPrompt.findUnique({
            where: { id: promptId },
        });
        if (!existing) {
            throw new NotFoundException("Prompt not found");
        }
        return prisma.channelPrompt.update({
            where: { id: promptId },
            data: {
                name: prompt.name,
                channelId: prompt.channelId,
                prompt: prompt.prompt ?? "",
            }
        });
    }
}