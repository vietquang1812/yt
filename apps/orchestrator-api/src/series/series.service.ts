import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@yt-ai/db";

@Injectable()
export class SeriesService {
  list() {
    return prisma.series.findMany({ orderBy: { createdAt: "desc" } });
  }

  async get(id: string) {
    const s = await prisma.series.findUnique({ where: { id }, include: { memory: true } });
    if (!s) throw new NotFoundException("Series not found");
    return s;
  }

  create(dto: { name: string; bible: any }) {
    return prisma.series.create({
      data: {
        name: dto.name,
        bible: dto.bible,
      },
    });
  }
}
 