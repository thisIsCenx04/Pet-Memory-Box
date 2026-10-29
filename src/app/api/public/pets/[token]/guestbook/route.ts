import { z } from "zod";
import { ConflictError } from "@/lib/errors";
import { jsonError, resolveForWrite, sameOrigin } from "@/lib/public-api";
import { submitGuestbookEntry } from "@/lib/services/community";

const schema = z.object({
  authorName: z.string().trim().min(1, "Nhập tên của bạn").max(50, "Tên tối đa 50 ký tự"),
  message: z.string().trim().min(1, "Nhập lời nhắn").max(500, "Lời nhắn tối đa 500 ký tự"),
  website: z.string().max(500).optional(), // bẫy bot: người dùng thật không thấy ô này; có giá trị thì bỏ qua
});

// Lời nhắn trong sổ lưu bút của trang tưởng niệm; chờ chủ nuôi hoặc admin duyệt mới hiện.
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!sameOrigin(req)) return jsonError(403, "forbidden", "Nguồn yêu cầu không hợp lệ");
  const { token } = await params;
  const target = await resolveForWrite(req, token);
  if (!target || target.lookup.result !== "ok" || !target.lookup.profile.guestbookOpen) {
    return jsonError(404, "tag_unavailable", "Sổ lưu bút không khả dụng");
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(400, "validation_failed", parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ");
  }
  if (parsed.data.website) return Response.json({ ok: true }, { status: 201 });
  try {
    await submitGuestbookEntry(target.lookup.petId, parsed.data, target.ipHash);
  } catch (e) {
    if (e instanceof ConflictError) return jsonError(422, "rejected", e.message);
    console.error(e);
    return jsonError(500, "server_error", "Chưa gửi được, vui lòng thử lại");
  }
  return Response.json({ ok: true }, { status: 201 });
}
