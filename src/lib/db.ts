import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  // Mỗi instance serverless giữ ít kết nối và trả lại sớm. Supabase pooler cổng 6543 (transaction)
  // chia sẻ kết nối giữa các instance; cổng 5432 (session) chỉ có 15 chỗ và sẽ báo EMAXCONNSESSION.
  const max = Number(process.env.DB_POOL_MAX) || 3;
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
