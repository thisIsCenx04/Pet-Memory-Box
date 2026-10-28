import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getSiteSettingsSafe } from "@/lib/services/admin-data";

// S-01. Đọc liên hệ từ site_settings nên render theo request.
export const dynamic = "force-dynamic";

const BOX_ITEMS = [
  ["Đất sét in dấu chân", "Lưu giữ dấu chân của bé một cách chân thực và bền lâu."],
  ["Ảnh", "Những khoảnh khắc đáng nhớ được in và lưu trong hộp, để bạn luôn nhớ về bé."],
  ["Lọ đựng lông", "Giữ lại một phần nhỏ của bé, như một kỷ vật đặc biệt."],
  ["Vòng cổ có mã QR", "Kết nối với trang Digital Memory, chứa ảnh, video và câu chuyện về bé."],
  ["Thẻ căn cước thú cưng", "Thông tin cơ bản của bé như tên, ngày sinh, giống loài."],
] as const;

const FEATURES = [
  ["Ảnh, video và câu chuyện ở cùng một nơi", "Không còn lạc giữa hàng nghìn tấm ảnh trong điện thoại."],
  ["Mở bằng camera điện thoại", "Không cần cài ứng dụng, không cần tài khoản."],
  ["Bạn chọn điều gì được hiển thị", "Số điện thoại, khu vực hay địa chỉ chỉ hiện khi bạn đồng ý."],
  ["Bé đi lạc, người nhặt gọi ngay cho bạn", "Nút gọi nằm ở đầu trang, chỉ một chạm."],
] as const;

const STEPS = [
  ["Chuẩn bị kỷ vật", "Gom ảnh, video, lông, dấu chân hay chiếc vòng cổ cũ của bé."],
  ["Nhắn cho admin", "Gửi ảnh và thông tin qua Zalo hoặc Messenger. Admin nhập hồ sơ và phát hành mã QR."],
  ["Nhận hộp kỷ vật", "Kỷ vật được sắp vào hộp thiếc cùng thẻ căn cước và vòng cổ đã in mã."],
  ["Quét để nhớ", "Mỗi lần quét mã là một lần gặp lại bé, ở bất cứ đâu."],
] as const;

const VALUES = [
  ["Giá trị tinh thần", "Mang lại cảm giác gần gũi, an ủi và giúp bạn trân trọng những khoảnh khắc đẹp."],
  ["Kết nối cảm xúc", "Giữ mối liên kết đặc biệt giữa bạn và bé, dù bé còn bên cạnh hay đã đi xa."],
  ["Bền vững", "Tận dụng vật liệu tái chế, hạn chế rác thải và khuyến khích tái sử dụng."],
  ["Giá trị lâu dài", "Hộp thiếc bền, dùng được nhiều năm, trở thành món đồ lưu niệm của cả gia đình."],
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
  ["Nếu làm mất vòng cổ thì sao?", "Nhắn cho admin để khóa mã cũ ngay và phát hành mã mới cho bé."],
  ["Tôi có thể chỉ đặt vòng cổ QR không?", "Có. Nhắn cho admin để được tư vấn gói chỉ vòng cổ QR và giá hiện tại."],
] as const;

const PREPARE = [
  "Ảnh và video của bé",
  "Tên, giống, ngày sinh, màu lông",
  "Tên chủ nuôi và số điện thoại",
  "Câu chuyện về bé (nếu muốn lưu)",
  "Kỷ vật: lông, dấu chân, vòng cổ cũ",
];

/** Hộp thiếc vẽ tay, nắp hé mở để lộ ảnh bên trong. */
function TinBox({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 250" className={className} role="img" aria-label="Hộp thiếc Pet Memory Box với ảnh của bé">
      <ellipse cx="190" cy="226" rx="118" ry="10" fill="#3f3329" opacity="0.08" />
      <g transform="rotate(-9 110 96)">
        <rect x="40" y="36" width="148" height="116" rx="8" fill="#fbf8f2" stroke="#d8c8ae" />
        <rect x="52" y="48" width="124" height="80" rx="3" fill="#e8b9a1" opacity="0.55" />
        <path d="M60 120c18-22 34-30 52-14s30-8 44-20 16 6 16 6v36H60z" fill="#566b4b" opacity="0.35" />
        <circle cx="146" cy="70" r="9" fill="#fbf8f2" opacity="0.7" />
        <text x="114" y="144" textAnchor="middle" fontFamily="var(--font-hand)" fontSize="12" fill="#9c5235">
          Mun, 2021
        </text>
      </g>
      <rect x="96" y="96" width="196" height="124" rx="20" fill="#cbbfae" />
      <rect x="96" y="96" width="196" height="124" rx="20" fill="none" stroke="#b4a58f" strokeWidth="2" />
      <rect x="109" y="109" width="170" height="98" rx="13" fill="none" stroke="#b4a58f" strokeWidth="1.4" strokeDasharray="1 5" strokeLinecap="round" />
      <g transform="translate(180 128) scale(0.95)" fill="#3f3329">
        <path d="M16 15.5c4.3 0 7.6 3.3 7.6 6.6 0 3.2-2.9 4.8-7.6 4.8s-7.6-1.6-7.6-4.8c0-3.3 3.3-6.6 7.6-6.6z" />
        <ellipse cx="7.4" cy="13.3" rx="2.9" ry="3.7" transform="rotate(-20 7.4 13.3)" />
        <ellipse cx="12.6" cy="7.6" rx="3" ry="3.9" transform="rotate(-7 12.6 7.6)" />
        <ellipse cx="19.3" cy="7.5" rx="3" ry="3.9" transform="rotate(8 19.3 7.5)" />
        <ellipse cx="24.5" cy="13.4" rx="2.9" ry="3.7" transform="rotate(21 24.5 13.4)" />
      </g>
      <text x="195" y="180" textAnchor="middle" fontFamily="var(--font-heading)" fontWeight="700" fontSize="13" fill="#3f3329" letterSpacing="1">
        PET
      </text>
      <text x="195" y="196" textAnchor="middle" fontFamily="var(--font-heading)" fontWeight="700" fontSize="13" fill="#3f3329" letterSpacing="1">
        MEMORY BOX
      </text>
    </svg>
  );
}

/** Nét gạch chân viết tay, tự vẽ khi tải trang. */
function Scribble({ delay = 0 }: { delay?: number }) {
  return (
    <svg
      viewBox="0 0 300 18"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="absolute -bottom-2 left-0 h-3 w-full text-peach"
    >
      <path
        d="M3 12c40-6 92-9 148-7s96 4 146-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        className="animate-draw"
        style={{ "--len": 320, "--rise-delay": `${delay}ms` } as React.CSSProperties}
      />
    </svg>
  );
}

function PhoneMock() {
  return (
    <div className="animate-tilt mx-auto w-64 rounded-[2.6rem] border-[9px] border-ink bg-cream p-3 shadow-[0_30px_60px_-30px_rgb(63_51_41/0.6)]">
      <div className="mx-auto mb-2 h-1.5 w-14 rounded-full bg-ink/80" />
      <div className="flex aspect-square items-center justify-center rounded-2xl bg-gradient-to-br from-peach-soft to-sand">
        <span className="font-heading text-6xl font-bold text-rust/70">M</span>
      </div>
      <p className="mt-3 text-center font-heading text-2xl font-bold">Mun</p>
      <p className="text-center font-hand text-lg text-rust">Always in my heart</p>
      <div className="mt-2 rounded-full bg-sage py-2 text-center text-xs font-semibold text-white">Gọi cho chủ nuôi</div>
      <div className="mt-3 flex justify-around border-b border-sand pb-1 text-[11px] text-ink-soft">
        <span className="font-semibold text-sage-deep">Ảnh</span>
        <span>Video</span>
        <span>Kỷ niệm</span>
        <span>Hồ sơ</span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        <div className="aspect-square rounded-lg bg-sand" />
        <div className="aspect-square rounded-lg bg-peach-soft" />
        <div className="aspect-square rounded-lg bg-sage-soft" />
      </div>
    </div>
  );
}

function SectionTitle({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <Reveal>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-2 max-w-xl text-4xl font-bold sm:text-[2.75rem]">{title}</h2>
      {children ? <p className="mt-3 max-w-xl text-ink-soft">{children}</p> : null}
    </Reveal>
  );
}

export default async function LandingPage() {
  const settings = await getSiteSettingsSafe();

  return (
    <>
      <span id="top" />
      <SiteHeader />

      <main>
        {/* Hero: kéo lên nằm dưới header trong suốt để mảng màu nền phủ kín đầu trang */}
        <section className="relative -mt-[76px] overflow-hidden pt-[76px]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-40 -right-32 h-[30rem] w-[30rem] rounded-full bg-peach-soft blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-60 -left-40 h-80 w-80 rounded-full bg-sage-soft blur-3xl"
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pt-8 pb-16 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pt-14 md:pb-24">
            <div>
              <p className="animate-rise font-hand text-2xl text-rust">Giữ lại những điều yêu thương</p>
              <h1
                className="animate-rise mt-2 text-[2.6rem] leading-[1.08] font-bold sm:text-6xl"
                style={{ "--rise-delay": "90ms" } as React.CSSProperties}
              >
                Không chỉ là một chiếc hộp, mà là nơi lưu giữ{" "}
                <span className="relative inline-block whitespace-nowrap">
                  kỷ niệm đẹp nhất
                  <Scribble delay={700} />
                </span>{" "}
                với thú cưng.
              </h1>
              <p
                className="animate-rise mt-5 max-w-lg text-lg text-ink-soft"
                style={{ "--rise-delay": "180ms" } as React.CSSProperties}
              >
                Một hộp thiếc đựng kỷ vật và vòng cổ gắn mã QR. Quét mã để mở trang Digital Memory riêng của bé, nơi lưu
                ảnh, video, câu chuyện và cả cách liên lạc khi cần.
              </p>
              <div
                className="animate-rise mt-8 flex flex-wrap gap-3"
                style={{ "--rise-delay": "270ms" } as React.CSSProperties}
              >
                <a href="#lien-he" className="btn-primary min-h-12 px-6 text-base">
                  Đặt hộp cho bé
                </a>
                <Link href="/demo" className="btn-outline min-h-12 px-6 text-base">
                  Xem trang Digital Memory mẫu
                </Link>
              </div>
            </div>
            <div
              className="animate-rise relative"
              style={{ "--rise-delay": "200ms" } as React.CSSProperties}
            >
              <div className="rounded-[2.5rem] bg-paper/70 p-6 ring-1 ring-sand backdrop-blur-sm sm:p-10">
                <TinBox className="animate-float mx-auto w-full max-w-md" />
              </div>
              <p className="absolute -bottom-4 left-6 rotate-[-4deg] rounded-full bg-sage px-4 py-1.5 font-hand text-lg text-white shadow-md">
                Mỗi bé một câu chuyện
              </p>
            </div>
          </div>
        </section>

        {/* Bên trong hộp */}
        <section id="ben-trong-hop" className="scroll-mt-20 border-y border-sand bg-paper">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 md:grid-cols-[1fr_1.15fr]">
            <div className="md:sticky md:top-28 md:self-start">
              <SectionTitle eyebrow="Cấu trúc sản phẩm" title="Năm món bên trong hộp thiếc." />
              <Reveal variant="scale" delay={120} className="mt-8 rounded-[2rem] bg-peach-soft p-6">
                <TinBox className="mx-auto w-full max-w-sm" />
              </Reveal>
            </div>
            <ol className="border-t border-sand">
              {BOX_ITEMS.map(([title, desc], i) => (
                <Reveal as="li" key={title} delay={i * 80} className="group flex gap-5 border-b border-sand py-6">
                  <span className="font-heading text-3xl leading-none font-bold text-peach transition-colors duration-300 group-hover:text-rust">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold">{title}</h3>
                    <p className="mt-1 text-ink-soft">{desc}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* Digital Memory */}
        <section id="digital-memory" className="scroll-mt-20 bg-sage-soft">
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-20 sm:px-6 md:grid-cols-2">
            <div>
              <SectionTitle eyebrow="Digital Memory" title="Một trang riêng cho mỗi bé, mở bằng một lần quét.">
                Không cần cài ứng dụng, không cần tài khoản. Chỉ cần mở camera điện thoại và quét mã trên vòng cổ.
              </SectionTitle>
              <ul className="mt-8 grid gap-5 sm:grid-cols-2">
                {FEATURES.map(([t, d], i) => (
                  <Reveal as="li" key={t} delay={i * 90} className="border-l-2 border-sage/40 pl-4">
                    <p className="font-semibold">{t}</p>
                    <p className="mt-1 text-sm text-ink-soft">{d}</p>
                  </Reveal>
                ))}
              </ul>
              <Reveal delay={200}>
                <Link href="/demo" className="btn-outline mt-8">
                  Xem trang đầy đủ
                </Link>
              </Reveal>
            </div>
            <Reveal variant="right" delay={150}>
              <PhoneMock />
            </Reveal>
          </div>
        </section>

        {/* Cách hoạt động */}
        <section id="cach-hoat-dong" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionTitle eyebrow="Cách hoạt động" title="Bốn bước để giữ lại những điều yêu thương.">
            Bạn chỉ cần nhắn tin gửi ảnh và thông tin của bé. Admin nhập hồ sơ, phát hành mã QR và lo phần còn lại.
          </SectionTitle>
          <ol className="relative mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <span
              aria-hidden="true"
              className="absolute top-9 right-[12%] left-[12%] hidden border-t-2 border-dashed border-sand-deep lg:block"
            />
            {STEPS.map(([t, d], i) => (
              <Reveal as="li" key={t} delay={i * 110} className="card lift relative p-6">
                <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-ink font-heading text-lg font-bold text-cream">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-xl font-semibold">{t}</h3>
                <p className="mt-1 text-sm text-ink-soft">{d}</p>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* Giá trị */}
        <section className="bg-paper">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <SectionTitle eyebrow="Giá trị sản phẩm mang lại" title="Những kỷ niệm đẹp xứng đáng được lưu giữ." />
            <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {VALUES.map(([t, d], i) => (
                <Reveal key={t} delay={i * 90} className="border-t-2 border-ink pt-4">
                  <h3 className="text-xl font-semibold">{t}</h3>
                  <p className="mt-2 text-sm text-ink-soft">{d}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Hỏi đáp */}
        <section id="hoi-dap" className="scroll-mt-20 mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 md:grid-cols-[1fr_2fr]">
          <SectionTitle eyebrow="Hỏi đáp" title="Những điều thường được hỏi" />
          <Reveal delay={100} className="divide-y divide-sand border-y border-sand">
            {FAQ.map(([q, a]) => (
              <details key={q} className="faq group">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                  {q}
                  <span
                    aria-hidden="true"
                    className="relative h-4 w-4 shrink-0 before:absolute before:top-1/2 before:left-0 before:h-0.5 before:w-4 before:-translate-y-1/2 before:rounded before:bg-ink-soft after:absolute after:top-0 after:left-1/2 after:h-4 after:w-0.5 after:-translate-x-1/2 after:rounded after:bg-ink-soft after:transition-transform after:duration-300 group-open:after:scale-y-0"
                  />
                </summary>
                <p className="pb-5 text-ink-soft">{a}</p>
              </details>
            ))}
          </Reveal>
        </section>

        {/* Liên hệ */}
        <section id="lien-he" className="scroll-mt-20 bg-peach-soft">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-2">
            <Reveal>
              <h2 className="text-4xl font-bold sm:text-5xl">Bắt đầu bằng một tin nhắn.</h2>
              <p className="mt-4 max-w-md text-ink-soft">
                Gửi ảnh và thông tin của bé cho admin. Admin nhập hồ sơ, phát hành mã QR và báo bạn khi hộp kỷ vật sẵn
                sàng.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {settings.zalo_url ? (
                  <a href={settings.zalo_url} target="_blank" rel="noopener" className="btn-primary min-h-12 px-6 text-base">
                    Nhắn qua Zalo
                  </a>
                ) : null}
                {settings.messenger_url ? (
                  <a
                    href={settings.messenger_url}
                    target="_blank"
                    rel="noopener"
                    className="btn-outline min-h-12 px-6 text-base"
                  >
                    Nhắn qua Messenger
                  </a>
                ) : null}
                {settings.hotline ? (
                  <a href={`tel:${settings.hotline}`} className="btn-outline min-h-12 px-6 text-base">
                    Gọi {settings.hotline.replace(/^(\d{4})(\d{3})(\d{3})$/, "$1 $2 $3")}
                  </a>
                ) : null}
              </div>
            </Reveal>
            <Reveal variant="right" delay={120} className="card rotate-1 p-7 shadow-[0_24px_50px_-30px_rgb(63_51_41/0.45)]">
              <p className="font-hand text-2xl text-rust">Chuẩn bị sẵn</p>
              <ul className="mt-4 space-y-3">
                {PREPARE.map((p, i) => (
                  <li key={p} className="flex items-baseline gap-3 border-b border-dashed border-sand pb-3 last:border-0">
                    <span className="font-heading text-sm font-bold text-peach">{String(i + 1).padStart(2, "0")}</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter settings={settings} />
    </>
  );
}
