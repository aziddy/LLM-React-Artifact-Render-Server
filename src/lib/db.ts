import { PrismaClient } from "@/generated/prisma/client";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const dbPath = path.join(process.cwd(), "prisma", "artifacts.db");
    globalForPrisma.prisma = new PrismaClient({
      datasources: {
        db: { url: `file:${dbPath}` },
      },
    });
  }
  return globalForPrisma.prisma;
}

export const prisma = getPrisma();
