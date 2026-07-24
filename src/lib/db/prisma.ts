import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

function createPrismaClient() {
  const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});
  return new PrismaClient({ adapter });
}

let _db: PrismaClient | undefined;

export function getDb() {
  if (!_db) _db = createPrismaClient();
  return _db;
}
