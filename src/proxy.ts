import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session-cookie";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // FR-37: bản production chỉ phục vụ trên tên miền SITE_URL; tên miền khác (ví dụ *.vercel.app cũ)
  // chuyển hướng 308 và giữ nguyên đường dẫn, để QR đã in vẫn dùng được (BR-10).
  if (process.env.VERCEL_ENV === "production" && process.env.SITE_URL) {
    const canonical = new URL(process.env.SITE_URL);
    if (req.nextUrl.host !== canonical.host) {
      const url = req.nextUrl.clone();
      url.protocol = canonical.protocol;
      url.host = canonical.host;
      url.port = "";
      return NextResponse.redirect(url, 308);
    }
  }

  const isAdminApi = pathname.startsWith("/api/admin");
  const isAdminPage = pathname.startsWith("/admin") && pathname !== "/admin/login";

  // Chống CSRF cho thao tác ghi tới API (NFR-07); Server Action đã tự kiểm tra Origin.
  if ((isAdminApi || pathname.startsWith("/api/auth")) && !["GET", "HEAD"].includes(req.method)) {
    const origin = req.headers.get("origin");
    if (!origin || new URL(origin).host !== req.headers.get("host")) {
      return NextResponse.json({ error: { code: "forbidden", message: "Nguồn yêu cầu không hợp lệ" } }, { status: 403 });
    }
  }

  // FR-08: chặn sớm khi không có cookie phiên. Phiên được kiểm tra đầy đủ ở máy chủ (requireAdmin).
  if (!req.cookies.has(SESSION_COOKIE)) {
    if (isAdminApi) {
      return NextResponse.json({ error: { code: "unauthorized", message: "Chưa đăng nhập" } }, { status: 401 });
    }
    if (isAdminPage) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = `?next=${encodeURIComponent(pathname + req.nextUrl.search)}`;
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt)$).*)"],
};
