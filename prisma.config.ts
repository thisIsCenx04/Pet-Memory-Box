import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// CLI (migrate, seed) dùng kết nối trực tiếp; runtime dùng DATABASE_URL qua pooler (src/lib/db.ts).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
