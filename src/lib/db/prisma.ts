import { PrismaClient } from "@prisma/client";

function createPrismaClient() {
  return new PrismaClient();
}

let _db: PrismaClient | undefined;

export function getDb() {
  if (!_db) _db = createPrismaClient();
  return _db;
}
