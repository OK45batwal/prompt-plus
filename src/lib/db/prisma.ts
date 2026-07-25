import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL || "file:./dev.db";

  if (dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://")) {
    const adapter = new PrismaNeonHttp(dbUrl, {});
    return new PrismaClient({ adapter });
  }

  const filePath = dbUrl.replace(/^file:/, "");
  const adapter = new PrismaBetterSqlite3({ url: filePath });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

export function getDb(): PrismaClient {
  return db;
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;


