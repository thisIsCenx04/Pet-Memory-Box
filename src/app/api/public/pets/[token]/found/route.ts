import { z } from "zod";
import { ConflictError } from "@/lib/errors";
import { jsonError, resolveForWrite, sameOrigin } from "@/lib/public-api";
import { createFoundReport } from "@/lib/services/community";

const schema = z.object({
  latitude: z.number().min(-90).max(90).nullish(),
  longitude: z.number().min(-180).max(180).nullish(),
  accuracyM: z.number().min(0).max(100000).nullish(),
  message: z.string().max(500).nullish(),
  finderContact: z.string().max(100).nullish(),
});

// Người nhặt được bé gửi vị trí hoặc lời nhắn cho chủ nuôi. Chỉ dành cho bé đang sống.
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!sameOrigin(req)) return jsonError(403, "forbidden", "Nguồn yêu cầu không hợp lệ");
  const { token } = await params;
  const target = await resolveForWrite(req, token);
  if (!target || target.lookup.result !== "ok" || target.lookup.profile.lifeStatus !== "alive") {
    return jsonError(404, "tag_unavailable", "Mã này hiện không khả dụng");
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "validation_failed", "Dữ liệu không hợp lệ");
  try {
    await createFoundReport({ petId: target.lookup.petId, qrTagId: target.lookup.qrTagId }, parsed.data, target.ipHash);
  } catch (e) {
    if (e instanceof ConflictError) return jsonError(422, "rejected", e.message);
    console.error(e);
    return jsonError(500, "server_error", "Chưa gửi được, vui lòng thử lại");
  }
  return Response.json({ ok: true }, { status: 201 });
}
