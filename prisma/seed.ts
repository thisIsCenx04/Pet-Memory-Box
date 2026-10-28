import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Tạo tài khoản admin đầu tiên từ SEED_ADMIN_EMAIL và SEED_ADMIN_PASSWORD.
// Chạy lại không ghi đè mật khẩu của tài khoản đã có.
async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password || password.length < 8) {
    throw new Error("Cần SEED_ADMIN_EMAIL và SEED_ADMIN_PASSWORD (từ 8 ký tự)");
  }
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }) });
  const existing = await db.adminUser.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin ${email} đã tồn tại, bỏ qua.`);
  } else {
    await db.adminUser.create({ data: { email, passwordHash: await bcrypt.hash(password, 12) } });
    console.log(`Đã tạo admin ${email}.`);
  }
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
