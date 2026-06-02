import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  pgPool?: pg.Pool;
  prisma?: PrismaClient;
};

function getPgPool(databaseUrl: string) {
  if (!globalForPrisma.pgPool) {
    globalForPrisma.pgPool = new pg.Pool({
      connectionString: databaseUrl,
      idleTimeoutMillis: 5_000,
      max: 1
    });
  }

  return globalForPrisma.pgPool;
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL. Add the Supabase pooled connection string to your environment.");
  }

  return new PrismaClient({
    adapter: new PrismaPg(getPgPool(databaseUrl), { disposeExternalPool: false }),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });
}

export const prisma =
  globalForPrisma.prisma ??
  createPrismaClient();

globalForPrisma.prisma = prisma;

export default prisma;
