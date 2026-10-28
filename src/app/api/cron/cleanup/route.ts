import { db } from "@/lib/db";
import { cleanupTmpUploads } from "@/lib/services/media";

// Vercel Cron gọi mỗi ngày (vercel.json): xóa ảnh tạm của form tạo hồ sơ bị bỏ dở
// và phiên đăng nhập đã hết hạn. Vercel gửi kèm "Authorization: Bearer $CRON_SECRET".
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const [tmpFiles, sessions] = await Promise.all([
    cleanupTmpUploads().catch((e) => {
      console.error("cleanup_tmp_failed", e);
      return -1;
    }),
    db.adminSession.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
  ]);
  return Response.json({ tmpFiles, sessions: sessions.count });
}
