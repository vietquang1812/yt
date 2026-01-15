import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

// re-export types/enums/models
export * from "@prisma/client";
