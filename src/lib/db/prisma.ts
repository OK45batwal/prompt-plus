import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const dbUrl =
    process.env.DATABASE_URL ||
    "postgresql://placeholder:placeholder@localhost:5432/placeholder";
  const adapter = new PrismaNeonHttp(dbUrl, {});
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

export function getDb(): PrismaClient {
  return db;
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

