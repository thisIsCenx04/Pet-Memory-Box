import type { Metadata } from "next";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getSiteSettingsSafe } from "@/lib/services/admin-data";

export const metadata: Metadata = {
  title: "Chính sách bảo mật",
  description: "Pet Memory Box thu thập, hiển thị và bảo vệ thông tin của chủ nuôi như thế nào.",
};

export const dynamic = "force-dynamic";

const SECTIONS: [string, string[]][] = [
  [
    "Thông tin chúng mình lưu",
    [
      "Thông tin của bé: tên, loài, giống, giới tính, ngày sinh, màu lông, đặc điểm nhận dạng, lưu ý sức khỏe, ảnh, video và câu chuyện bạn gửi.",
      "Thông tin của chủ nuôi: họ tên, số điện thoại, Zalo hoặc Messenger, khu vực và địa chỉ (nếu bạn cung cấp).",
      "Khi có người mở trang của bé, hệ thống ghi thời điểm, kết quả và một giá trị băm của địa chỉ IP. Chúng mình không lưu địa chỉ IP gốc.",
    ],
  ],
  [
    "Thông tin nào được hiển thị công khai",
    [
      "Mỗi bé có một đường dẫn riêng chứa mã ngẫu nhiên khó đoán. Trang của bé không xuất hiện ở trang chủ, không có danh sách công khai và không được công cụ tìm kiếm lập chỉ mục.",
      "Chỉ những mục bạn đồng ý mới hiển thị khi quét mã. Mặc định, số điện thoại phụ và địa chỉ đầy đủ được ẩn.",
      "Mục nào bị tắt thì không được gửi tới trình duyệt của người quét, không chỉ bị che trên giao diện.",
    ],
  ],
  [
    "Khi mất vòng cổ hoặc muốn ngừng hiển thị",
    [
      "Nhắn cho admin để khóa mã. Mã bị khóa sẽ không còn hiển thị bất kỳ thông tin nào của bé hay của bạn.",
      "Admin có thể phát hành mã mới cho vòng cổ mới; mã cũ ngừng hoạt động vĩnh viễn.",
      "Bạn có thể yêu cầu ẩn hồ sơ khỏi trang công khai hoặc sửa thông tin bất cứ lúc nào.",
    ],
  ],
  [
    "Bảo vệ dữ liệu",
    [
      "Toàn bộ kết nối dùng HTTPS. Chỉ admin của Pet Memory Box đăng nhập được vào trang quản trị.",
      "Dữ liệu được lưu trên hạ tầng có sao lưu hằng ngày. Chúng mình không bán hay chia sẻ thông tin của bạn cho bên thứ ba.",
    ],
  ],
];

export default async function PrivacyPage() {
  const settings = await getSiteSettingsSafe();
  return (
    <>
      <span id="top" />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="eyebrow">Pet Memory Box</p>
        <h1 className="animate-rise mt-2 text-4xl font-bold sm:text-5xl">Chính sách bảo mật</h1>
        <p className="mt-4 text-ink-soft">
          Thông tin của bé và của bạn là những điều riêng tư. Trang này giải thích chúng mình lưu gì, hiển thị gì và bạn
          kiểm soát những gì.
        </p>
        <div className="mt-10 space-y-10">
          {SECTIONS.map(([title, items]) => (
            <section key={title}>
              <h2 className="text-2xl font-semibold">{title}</h2>
              <ul className="mt-3 space-y-2 text-ink-soft">
                {items.map((t) => (
                  <li key={t} className="flex gap-3">
                    <span aria-hidden="true" className="mt-3 h-px w-4 shrink-0 bg-sage" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <p className="mt-12 rounded-2xl bg-paper p-5 text-sm text-ink-soft">
          Có câu hỏi về dữ liệu của bạn? Nhắn cho chúng mình qua các kênh ở chân trang.
        </p>
      </main>
      <SiteFooter settings={settings} />
    </>
  );
}
