import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { renderQrPng, renderQrSvg } from "@/lib/services/qr";
import { publicPetUrl } from "@/lib/site";

// API-16: tải ảnh QR của mã hiện tại (PNG 1024 x 1024 hoặc SVG), tên tệp theo mã thẻ.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: { code: "unauthorized", message: "Chưa đăng nhập" } }, { status: 401 });
  }
  const { id } = await params;
  const format = new URL(req.url).searchParams.get("format") === "svg" ? "svg" : "png";
  const pet = /^[0-9a-f-]{36}$/i.test(id)
    ? await db.pet.findUnique({
        where: { id },
        select: { cardNo: true, qrTags: { where: { status: { not: "replaced" } }, take: 1 } },
      })
    : null;
  const tag = pet?.qrTags[0];
  if (!pet || !tag) {
    return NextResponse.json({ error: { code: "not_found", message: "Không tìm thấy mã" } }, { status: 404 });
  }

  const url = publicPetUrl(tag.token);
  const headers = {
    "Content-Disposition": `attachment; filename="${pet.cardNo}.${format}"`,
    "Cache-Control": "private, no-store",
  };
  if (format === "svg") {
    return new Response(await renderQrSvg(url), { headers: { ...headers, "Content-Type": "image/svg+xml" } });
  }
  const png = await renderQrPng(url);
  return new Response(new Uint8Array(png), { headers: { ...headers, "Content-Type": "image/png" } });
}
