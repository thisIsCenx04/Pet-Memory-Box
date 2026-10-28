import { NextResponse } from "next/server";
import { after } from "next/server";
import {
  clientIp,
  hashIp,
  isRateLimited,
  logScan,
  lookupPublicProfile,
  shortUserAgent,
} from "@/lib/services/public-profile";

const NO_INDEX = { "X-Robots-Tag": "noindex", "Cache-Control": "no-store" };

// API-22: dữ liệu công khai đã lọc theo cấu hình. Mọi trường hợp không dùng được đều trả 404.
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const ipHash = hashIp(clientIp(req.headers));
  if (await isRateLimited(ipHash)) {
    return NextResponse.json(
      { error: { code: "rate_limited", message: "Quá nhiều yêu cầu, thử lại sau" } },
      { status: 429, headers: { ...NO_INDEX, "Retry-After": "60" } },
    );
  }
  const lookup = await lookupPublicProfile(token);
  after(() =>
    logScan({ qrTagId: lookup.qrTagId, result: lookup.result, ipHash, userAgent: shortUserAgent(req.headers.get("user-agent")) }),
  );
  if (lookup.result !== "ok") {
    return NextResponse.json(
      { error: { code: "tag_unavailable", message: "Mã này hiện không khả dụng" } },
      { status: 404, headers: NO_INDEX },
    );
  }
  return NextResponse.json(lookup.profile, { headers: NO_INDEX });
}
