# Pet Memory Box

Website đi kèm hộp kỷ vật thú cưng: trang Digital Memory mở bằng mã QR trên vòng cổ, và trang quản trị để admin nhập hồ sơ, phát hành, khóa và cấp lại mã. Đặc tả: `docs/Pet_Memory_Box_RDS_SRS_v2.md` (bản v2).

## Công nghệ

- Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS 4
- Supabase Postgres qua Prisma 7 (`@prisma/adapter-pg`); Supabase Storage cho ảnh và video
- Xác thực admin tự viết: bcrypt, bảng `admin_sessions`, cookie httpOnly (D-04)
- Zod cho kiểm tra dữ liệu, `qrcode` để sinh QR, Vitest cho unit test

## Chạy trên máy

Cần Node 22 và một Postgres (Supabase hoặc Postgres cục bộ).

```bash
npm install
cp .env.example .env   # điền DATABASE_URL, DIRECT_URL, SITE_URL, IP_HASH_SALT, SEED_ADMIN_*
npm run db:migrate     # tạo bảng, sequence mã thẻ, chỉ mục, ràng buộc
npm run db:seed        # tạo tài khoản admin đầu tiên
npm run dev            # http://localhost:3000, quản trị ở /admin
```

Kiểm tra: `npm run typecheck`, `npm run lint`, `npm test`.

## Triển khai lên Vercel + Supabase

1. Dự án Supabase hiện ở region **Sydney (ap-southeast-2)**. Trước khi giao vòng cổ đầu tiên, chuyển sang gói **Pro**: gói Free tự tạm dừng sau 1 tuần không hoạt động và không có sao lưu tự động (R-10, NFR-13).
2. Tạo dự án Vercel tên **pet-memory-box**, Function Region `syd1` (cùng region với cơ sở dữ liệu). Tên dự án quyết định tên miền `*.vercel.app` in trên các vòng đầu tiên, **không bao giờ xóa hay đổi tên dự án** (R-09).
3. Biến môi trường trên Vercel: như `.env.example`. `DATABASE_URL` dùng pooler cổng 6543, `DIRECT_URL` dùng cổng 5432.
4. Chạy `npm run db:migrate` và `npm run db:seed` với `DIRECT_URL` của Supabase.
5. Khi có tên miền riêng: thêm tên miền vào dự án Vercel, giữ nguyên tên miền `*.vercel.app` trong dự án, đổi `SITE_URL` sang tên miền mới. Proxy tự chuyển hướng 308 mọi request từ tên miền cũ sang tên miền mới, giữ nguyên `/p/{token}` (FR-37), nên QR đã in vẫn dùng được.

## Cấu trúc

```
prisma/                      schema, migration (kèm SQL thủ công), seed
src/proxy.ts                 chặn /admin khi chưa có phiên, chống CSRF, chuyển hướng tên miền
src/lib/auth.ts              đăng nhập, phiên, khóa 15 phút sau 5 lần sai, đổi mật khẩu
src/lib/validation.ts        quy tắc mục 10.2
src/lib/services/            nghiệp vụ: hồ sơ, mã QR, trang công khai, đơn hàng, nhật ký
src/app/admin/actions.ts     Server Action của trang quản trị
src/app/admin/(panel)/       các màn A-02 đến A-09
src/app/p/[token]/           trang Digital Memory (S-03) và trang mã không khả dụng (S-04)
src/app/api/                 API-16 (tải QR), API-22 (dữ liệu công khai)
```

## Tình trạng so với SRS v2

Đã làm:

- Landing page (S-01), trang mẫu `/demo` (S-02), trang Digital Memory `/p/[token]` có 4 tab và chế độ tưởng niệm, trang 404 chung cho mọi mã không dùng được
- Đăng nhập, đăng xuất, khóa tạm khi sai 5 lần, đổi mật khẩu và hủy phiên khác
- Tạo hồ sơ (sinh mã thẻ từ sequence, token 22 ký tự, đơn hàng, cấu hình hiển thị trong một giao dịch), cảnh báo trùng, danh sách và tìm kiếm, chi tiết, sửa có khóa lạc quan
- 8 công tắc hiển thị; mục tắt không có trong dữ liệu gửi tới trình duyệt
- Tải QR PNG 1024 px / SVG, khóa, mở khóa, phát hành lại; trigger chặn mã `replaced` quay lại
- Kỷ niệm (thêm, xóa, sắp xếp), link YouTube/Vimeo, đơn hàng, tổng quan, cài đặt Zalo/Messenger, nhật ký thao tác
- Giới hạn 60 lượt/phút/IP, ghi lượt quét sau khi trả trang, `noindex`, HSTS

Chưa làm (cần dự án Supabase để làm và kiểm thử):

- Tải ảnh lên Storage, ảnh đại diện khi tạo hồ sơ (API-11, 12, 13, 25)
- Tải video lên trực tiếp kèm ảnh bìa (API-14 phần upload)
- Xem trước cấu hình hiển thị chưa lưu (FR-16)

Khác với tài liệu:

- Trang quản trị dùng Server Action thay cho phần lớn API `/api/admin/*` trong mục 16; logic nằm ở `src/lib/services` nên có thể bọc thành Route Handler khi cần.
- Khi vượt giới hạn tốc độ, `/api/public/pets/[token]` trả 429; trang `/p/[token]` hiện thông báo "thử lại sau" nhưng mã HTTP là 200 (App Router không đặt được mã 429 cho trang).
- Trang công khai không dùng bộ nhớ đệm: mỗi lần quét đọc thẳng cơ sở dữ liệu, nên khóa mã có hiệu lực ngay, không cần xóa cache.
