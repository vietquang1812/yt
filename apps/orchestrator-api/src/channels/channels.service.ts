import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma } from "@yt-ai/db";
import { ChannelDto } from "./type";


@Injectable()
export class ChannelsService {
    async list() {
        return await prisma.channel.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                image: true,
                character: true,
                persona: true,
                pipeline: true,
                style_rules: true,
                channelPrompts: true,
                projects: true,
                createdAt: true
            },
        });
    }

    async create(channel: ChannelDto) {
        return prisma.channel.create({
            data: {
                name: channel.name,
                image: channel.image,
                persona: channel.persona,
                pipeline: channel.pipeline,
                character: channel.character,
                style_rules: channel.style_rules,
            }
        });
    }
}

