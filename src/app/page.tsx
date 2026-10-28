import Link from "next/link";
import { PawMark, Wordmark } from "@/components/paw-logo";
import { getSiteSettings } from "@/lib/services/admin-data";

// S-01. Đọc liên kết Zalo/Messenger từ site_settings nên render theo request.
export const dynamic = "force-dynamic";

const BOX_ITEMS = [
  ["Đất sét in dấu chân", "Lưu giữ dấu chân của thú cưng một cách chân thực và bền lâu."],
  ["Ảnh", "Những khoảnh khắc đáng nhớ được lưu trong hộp, giúp bạn luôn nhớ về bé."],
  ["Lọ đựng lông", "Lưu giữ một phần nhỏ của thú cưng, như một kỷ vật đặc biệt."],
  ["Vòng cổ có mã QR", "Kết nối với trang Digital Memory, chứa ảnh, video và câu chuyện về bé."],
  ["Thẻ căn cước thú cưng", "Thông tin cơ bản của bé như tên, ngày sinh, giống loài."],
] as const;

const STEPS = [
  ["Chuẩn bị kỷ vật", "Thu thập các kỷ vật có ý nghĩa của bé: ảnh, vòng cổ, lông, dấu chân…"],
  ["Tạo Pet Memory Box", "Kỷ vật được sắp xếp và đóng gói trong hộp thiếc cùng thẻ căn cước và vòng cổ có mã QR."],
  ["Truy cập Digital Memory", "Quét mã QR để xem lại hình ảnh, video và câu chuyện về bé."],
  ["Lưu giữ và trân trọng", "Luôn mang theo những kỷ niệm đẹp và cảm nhận sự hiện diện của bé trong tim bạn."],
] as const;

const VALUES = [
  ["Giá trị tinh thần", "Mang lại cảm giác gần gũi, an ủi và giúp bạn trân trọng những khoảnh khắc đẹp."],
  ["Kết nối cảm xúc", "Giữ gìn mối liên kết đặc biệt giữa bạn và thú cưng, dù bé còn bên cạnh hay đã đi xa."],
  ["Bền vững", "Tận dụng vật liệu tái chế, hạn chế rác thải và khuyến khích tái sử dụng sản phẩm."],
  ["Giá trị lâu dài", "Hộp thiếc bền, dùng được nhiều lần, trở thành món đồ lưu niệm ý nghĩa."],
] as const;

const FAQ = [
  [
    "Tôi cần chuẩn bị gì khi đặt hộp?",
    "Ảnh và video của bé, tên, giống, ngày sinh, thông tin liên hệ của bạn, cùng những kỷ vật bạn muốn lưu giữ như lông hoặc dấu chân.",
  ],
  [
    "Pet Memory Box dành cho bé còn sống hay bé đã mất?",
    "Cả hai. Với bé đang sống, vòng cổ QR giúp người nhặt được bé gọi ngay cho bạn. Với bé đã đi xa, trang của bé trở thành trang tưởng niệm lưu giữ ảnh, video và câu chuyện.",
  ],
  [
    "Thông tin của tôi có bị công khai không?",
    "Mỗi bé có một đường dẫn riêng khó đoán, không xuất hiện ở trang chủ hay công cụ tìm kiếm. Người quét mã chỉ thấy các mục bạn đã đồng ý hiển thị.",
  ],
  ["Nếu làm mất vòng cổ thì sao?", "Nhắn cho admin để khóa mã cũ và phát hành mã mới cho bé."],
  ["Tôi có thể chỉ đặt vòng cổ QR không?", "Có. Nhắn cho admin để được tư vấn gói chỉ vòng cổ QR và giá hiện tại."],
] as const;

const PREPARE = [
  "Ảnh và video của bé",
  "Tên, giống, ngày sinh, màu lông",
  "Tên chủ nuôi và số điện thoại",
  "Câu chuyện về bé (nếu muốn lưu)",
  "Kỷ vật: lông, dấu chân, vòng cổ cũ",
];

function TinBox({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 240" className={className} role="img" aria-label="Hộp thiếc Pet Memory Box">
      <rect x="44" y="34" width="150" height="112" rx="10" fill="#e3d6c1" transform="rotate(-8 119 90)" />
      <rect x="56" y="46" width="126" height="78" rx="4" fill="#cdbb9c" transform="rotate(-8 119 90)" />
      <rect x="96" y="92" width="190" height="122" rx="18" fill="#cbbfae" />
      <rect x="96" y="92" width="190" height="122" rx="18" fill="none" stroke="#b4a58f" strokeWidth="2" />
      <rect x="108" y="104" width="166" height="98" rx="12" fill="none" stroke="#b4a58f" strokeWidth="1.5" />
      <g transform="translate(176 126) scale(0.9)" fill="#3f3329">
        <ellipse cx="16" cy="21.5" rx="7.2" ry="6.2" />
        <ellipse cx="7.2" cy="13.6" rx="3.1" ry="3.9" />
        <ellipse cx="12.6" cy="7.6" rx="3.1" ry="4" />
        <ellipse cx="19.4" cy="7.6" rx="3.1" ry="4" />
        <ellipse cx="24.8" cy="13.6" rx="3.1" ry="3.9" />
      </g>
      <text x="191" y="176" textAnchor="middle" fontFamily="var(--font-heading)" fontWeight="700" fontSize="13" fill="#3f3329">
        PET
      </text>
      <text x="191" y="192" textAnchor="middle" fontFamily="var(--font-heading)" fontWeight="700" fontSize="13" fill="#3f3329">
        MEMORY BOX
      </text>
    </svg>
  );
}

function PhoneMock() {
  return (
    <div className="mx-auto w-60 rounded-[2.5rem] border-8 border-ink bg-cream p-3 shadow-xl">
      <div className="aspect-square rounded-2xl bg-sand" />
      <p className="mt-3 text-center font-heading text-2xl font-bold">Mun</p>
      <p className="text-center font-hand text-lg text-rust">Always in my heart</p>
      <div className="mt-2 rounded-full bg-sage py-2 text-center text-xs font-semibold text-white">Gọi cho chủ nuôi</div>
      <div className="mt-3 flex justify-around border-b border-sand pb-1 text-[11px] text-ink-soft">
        <span className="font-semibold text-sage-deep">Ảnh</span>
        <span>Video</span>
        <span>Kỷ niệm</span>
        <span>Hồ sơ</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <div className="aspect-square rounded-lg bg-sand" />
        <div className="aspect-square rounded-lg bg-sand-deep/60" />
      </div>
    </div>
  );
}

export default async function LandingPage() {
  const settings = await getSiteSettings();
  const contactButtons = (
    <div className="flex flex-wrap gap-3">
      {settings.zalo_url ? (
        <a href={settings.zalo_url} target="_blank" rel="noopener" className="btn-primary">
          Nhắn qua Zalo
        </a>
      ) : null}
      {settings.messenger_url ? (
        <a href={settings.messenger_url} target="_blank" rel="noopener" className="btn-outline">
          Nhắn qua Messenger
        </a>
      ) : null}
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-sand/70 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Wordmark />
          <nav className="hidden gap-6 text-sm md:flex" aria-label="Mục trang">
            <a href="#ben-trong-hop" className="hover:text-sage">
              Bên trong hộp
            </a>
            <a href="#digital-memory" className="hover:text-sage">
              Digital Memory
            </a>
            <a href="#cach-hoat-dong" className="hover:text-sage">
              Cách hoạt động
            </a>
            <a href="#hoi-dap" className="hover:text-sage">
              Hỏi đáp
            </a>
          </nav>
          <a href="#lien-he" className="btn-primary">
            Đặt hộp cho bé
          </a>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 md:py-20">
          <div>
            <p className="font-hand text-xl text-rust">Giữ lại những điều yêu thương</p>
            <h1 className="mt-2 text-4xl font-bold sm:text-5xl">
              Không chỉ là một chiếc hộp, mà là nơi lưu giữ kỷ niệm đẹp nhất với thú cưng.
            </h1>
            <p className="mt-4 max-w-lg text-ink-soft">
              Pet Memory Box gồm một hộp thiếc đựng kỷ vật và vòng cổ gắn mã QR. Quét mã để mở trang Digital Memory riêng
              của bé, nơi lưu ảnh, video, câu chuyện và cả thông tin liên hệ khi cần.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#lien-he" className="btn-primary">
                Đặt hộp cho bé
              </a>
              <Link href="/demo" className="btn-outline">
                Xem trang Digital Memory mẫu
              </Link>
            </div>
          </div>
          <div className="rounded-[2rem] bg-peach-soft p-6">
            <TinBox className="mx-auto w-full max-w-md" />
          </div>
        </section>

        <section id="ben-trong-hop" className="border-t border-sand bg-paper">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1fr_1.2fr]">
            <div>
              <p className="eyebrow">Cấu trúc sản phẩm</p>
              <h2 className="mt-2 text-4xl font-bold">Năm món bên trong hộp thiếc.</h2>
              <div className="mt-6 rounded-[2rem] bg-peach-soft p-6">
                <TinBox className="mx-auto w-full max-w-sm" />
              </div>
            </div>
            <ol className="divide-y divide-sand border-t border-sand">
              {BOX_ITEMS.map(([title, desc], i) => (
                <li key={title} className="flex gap-4 py-5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink font-heading text-sm font-bold text-cream">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <p className="text-sm text-ink-soft">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="digital-memory" className="bg-sage-soft">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2">
            <div>
              <p className="eyebrow">Digital Memory</p>
              <h2 className="mt-2 text-4xl font-bold">Một trang riêng cho mỗi bé, mở bằng một lần quét.</h2>
              <p className="mt-3 text-ink-soft">
                Không cần cài ứng dụng, không cần tài khoản. Chỉ cần mở camera điện thoại và quét mã trên vòng cổ.
              </p>
              <ul className="mt-6 space-y-4">
                {[
                  ["Lưu trữ hình ảnh, video và câu chuyện", "Mọi kỷ niệm của bé ở cùng một nơi."],
                  ["Dễ dàng truy cập bằng mã QR trên vòng cổ", "Mở ngay trên trình duyệt điện thoại."],
                  ["Giao diện đơn giản, bảo mật thông tin", "Bạn chọn thông tin nào được hiển thị công khai."],
                  ["Khi bé đi lạc, người nhặt được gọi ngay cho bạn", "Thông tin liên hệ nằm ngay trên trang, chỉ một chạm để gọi."],
                ].map(([t, d]) => (
                  <li key={t} className="flex gap-3">
                    <PawMark className="mt-1 h-4 w-4 shrink-0 text-sage" />
                    <div>
                      <p className="font-semibold">{t}</p>
                      <p className="text-sm text-ink-soft">{d}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <Link href="/demo" className="btn-outline mt-6">
                Xem trang đầy đủ
              </Link>
            </div>
            <PhoneMock />
          </div>
        </section>

        <section id="cach-hoat-dong" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="eyebrow">Cách hoạt động</p>
          <h2 className="mt-2 max-w-xl text-4xl font-bold">Bốn bước để giữ lại những điều yêu thương.</h2>
          <p className="mt-3 max-w-xl text-ink-soft">
            Bạn chỉ cần nhắn tin gửi ảnh và thông tin của bé cho admin. Admin sẽ nhập hồ sơ, phát hành mã QR và lo phần còn
            lại.
          </p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([t, d], i) => (
              <li key={t} className="card p-5">
                <p className="font-heading text-3xl font-bold text-peach">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-2 text-lg font-semibold">{t}</h3>
                <p className="mt-1 text-sm text-ink-soft">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="bg-paper">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <p className="eyebrow">Giá trị sản phẩm mang lại</p>
            <h2 className="mt-2 max-w-xl text-4xl font-bold">Những kỷ niệm đẹp xứng đáng được lưu giữ.</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {VALUES.map(([t, d]) => (
                <div key={t}>
                  <h3 className="text-lg font-semibold">{t}</h3>
                  <p className="mt-1 text-sm text-ink-soft">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="hoi-dap" className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-[1fr_2fr]">
          <div>
            <p className="eyebrow">Hỏi đáp</p>
            <h2 className="mt-2 text-4xl font-bold">Những điều thường được hỏi</h2>
          </div>
          <div className="divide-y divide-sand border-y border-sand">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group py-4">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {q}
                  <span className="text-xl text-ink-soft transition-transform group-open:rotate-45" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p className="mt-2 text-sm text-ink-soft">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="lien-he" className="bg-peach-soft">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2">
            <div>
              <h2 className="text-4xl font-bold">Bắt đầu bằng một tin nhắn.</h2>
              <p className="mt-3 text-ink-soft">
                Gửi ảnh và thông tin của bé cho admin. Admin sẽ nhập hồ sơ, phát hành mã QR và báo bạn khi hộp kỷ vật sẵn
                sàng.
              </p>
              <div className="mt-6">{contactButtons}</div>
              {!settings.zalo_url && !settings.messenger_url ? (
                <p className="mt-4 text-sm text-ink-soft">Kênh nhắn tin đang được cập nhật.</p>
              ) : null}
            </div>
            <div className="card p-6">
              <p className="eyebrow">Chuẩn bị sẵn</p>
              <ul className="mt-3 space-y-3">
                {PREPARE.map((p) => (
                  <li key={p} className="flex items-center gap-3 text-sm">
                    <PawMark className="h-4 w-4 shrink-0 text-sage" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-sand">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-ink-soft sm:px-6">
          <Wordmark />
          <span className="font-hand text-lg text-rust">Vì tình yêu thương luôn tồn tại, theo một cách khác.</span>
          <span>
            {settings.contact_email ? <>Liên hệ: {settings.contact_email} · </> : null}© {new Date().getFullYear()} Pet
            Memory Box
          </span>
        </div>
      </footer>
    </>
  );
}
