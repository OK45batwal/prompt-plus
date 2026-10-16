import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  // Fail loudly in production rather than connecting to a placeholder host at query time.
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl && process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL is not set. Configure it before deploying.");
  }
  const adapter = new PrismaNeonHttp(
    dbUrl || "postgresql://placeholder:placeholder@localhost:5432/placeholder",
    {}
  );
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

export function getDb(): PrismaClient {
  return db;
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

