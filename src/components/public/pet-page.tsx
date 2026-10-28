import { PawMark } from "@/components/paw-logo";
import type { PublicProfile } from "@/lib/services/public-profile";
import { PetTabs } from "./pet-tabs";

const SPECIES = { dog: "Chó", cat: "Mèo", other: "Thú cưng" } as const;
const GENDER = { male: "Đực", female: "Cái", unknown: "" } as const;

function vnDate(iso: string | null) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function prettyPhone(p: string) {
  return p.replace(/^(\d{4})(\d{3})(\d{3})$/, "$1 $2 $3");
}

/** Trang Digital Memory (S-03), dùng chung cho /p/[token] và /demo. */
export function PetPage({ profile, banner }: { profile: PublicProfile; banner?: React.ReactNode }) {
  const memorial = profile.lifeStatus === "memorial";
  const { contact } = profile;
  const subtitle = [SPECIES[profile.species] + (profile.breed ? ` ${profile.breed}` : ""), GENDER[profile.gender]]
    .filter(Boolean)
    .join(" · ");
  const lifespan =
    memorial && profile.passedDate
      ? [vnDate(profile.birthDate), vnDate(profile.passedDate)].filter(Boolean).join(" – ")
      : null;

  return (
    <main className="mx-auto min-h-dvh max-w-md bg-cream pb-10">
      {banner}
      <header className="flex items-center justify-between px-4 py-4">
        <span className="inline-flex items-center gap-2 font-heading text-sm font-bold tracking-wide">
          <PawMark className="h-4 w-4" /> PET MEMORY BOX
        </span>
        <span className="font-mono text-xs text-ink-soft">{profile.cardNo}</span>
      </header>

      <section className="animate-rise px-4 text-center">
        <div className="mx-auto aspect-square w-full max-w-[22rem] overflow-hidden rounded-[2rem] bg-sand">
          {profile.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.coverUrl}
              srcSet={profile.coverThumbUrl ? `${profile.coverThumbUrl} 640w, ${profile.coverUrl} 2000w` : undefined}
              sizes="(max-width: 400px) 92vw, 352px"
              alt={`Ảnh của ${profile.name}`}
              fetchPriority="high"
              className={`h-full w-full object-cover ${memorial ? "saturate-[0.85]" : ""}`}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-peach-soft to-sand">
              <span className="font-heading text-[9rem] leading-none font-bold text-rust/60">
                {profile.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <h1 className="mt-5 text-5xl font-bold">{profile.name}</h1>
        {profile.tagline ? <p className="mt-1 font-hand text-2xl text-rust">{profile.tagline}</p> : null}
        <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>
        {lifespan ? <p className="mt-1 text-sm text-ink-soft">{lifespan}</p> : null}

        {!memorial && (contact.callButton || contact.phone) ? (
          <p className="mx-auto mt-4 max-w-xs text-sm">
            Nếu bạn đang giữ bé, xin hãy liên lạc ngay với chủ nuôi. Cảm ơn bạn rất nhiều.
          </p>
        ) : null}

        {contact.callButton && contact.phone ? (
          <div className="mt-4 space-y-2">
            <a href={`tel:${contact.phone}`} className="btn-primary min-h-13 w-full text-base">
              {memorial ? "Liên hệ gia đình" : "Gọi cho chủ nuôi"}
            </a>
            <a href={`sms:${contact.phone}`} className="btn-outline min-h-13 w-full text-base">
              Nhắn tin
            </a>
            {/* UC-20 A2: máy tính không gọi được thì hiện số để sao chép */}
            <p className="hidden text-sm text-ink-soft [@media(hover:hover)_and_(pointer:fine)]:block">
              Số điện thoại: <span className="font-semibold text-ink select-all">{prettyPhone(contact.phone)}</span>
            </p>
          </div>
        ) : contact.phone ? (
          <p className="mt-4 text-sm">
            {memorial ? "Liên hệ gia đình" : "Số điện thoại chủ nuôi"}:{" "}
            <span className="font-semibold select-all">{prettyPhone(contact.phone)}</span>
          </p>
        ) : null}
      </section>

      <section className="animate-rise mt-8 px-4" style={{ "--rise-delay": "150ms" } as React.CSSProperties}>
        <PetTabs profile={profile} />
      </section>

      <footer className="mt-10 px-6 text-center">
        <p className="font-hand text-xl text-rust">Vì tình yêu thương luôn tồn tại, theo một cách khác.</p>
        <p className="mt-2 text-xs text-ink-soft">Thẻ được cấp bởi Pet Memory Box · Thông tin do chủ nuôi cung cấp</p>
      </footer>
    </main>
  );
}
