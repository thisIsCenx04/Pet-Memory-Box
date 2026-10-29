import Link from "next/link";
import {
  addMemoryAction,
  addVideoLinkAction,
  deleteMemoryAction,
  lockTagAction,
  moveMemoryAction,
  saveVisibilityAction,
  unlockTagAction,
} from "@/app/admin/actions";
import { LockForm, MemoryForm, VideoLinkForm, VisibilityForm } from "@/app/admin/(panel)/pets/[id]/forms";
import { updatePublicInfoAction } from "@/app/chu-nuoi/actions";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Badge } from "@/components/admin/page-header";
import { PhotoManager } from "@/components/admin/photo-manager";
import { VideoManager } from "@/components/admin/video-manager";
import { Section } from "@/components/form";
import { FoundReports, ScanList } from "@/components/owner/activity";
import { GuestbookModeration } from "@/components/owner/guestbook-moderation";
import { NotifyToggle } from "@/components/owner/notify-toggle";
import { formatDate } from "@/lib/format";
import { requireOwnerPet } from "@/lib/owner-auth";
import { listFoundReports, listGuestbook, recentScans } from "@/lib/services/community";
import { videoMaxBytes } from "@/lib/services/media";
import { getOwnerPet } from "@/lib/services/owner-portal";
import { publicPetUrl } from "@/lib/site";
import { PublicInfoForm } from "./info-form";

type Tab = "overview" | "info" | "photos" | "videos" | "memories" | "visibility" | "guestbook";

export default async function OwnerPetPage({
  params,
  searchParams,
}: {
  params: Promise<{ petId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { petId } = await params;
  const { pet: access } = await requireOwnerPet(petId);
  const [pet, reports, scans, guestbook] = await Promise.all([
    getOwnerPet(petId),
    listFoundReports(petId),
    recentScans(petId),
    listGuestbook(petId),
  ]);
  const memorial = pet.lifeStatus === "memorial";
  const readOnly = access.status === "archived";
  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Tổng quan" },
    { key: "info", label: "Mô tả" },
    { key: "photos", label: "Ảnh" },
    { key: "videos", label: "Video" },
    { key: "memories", label: "Kỷ niệm" },
    { key: "visibility", label: "Hiển thị công khai" },
    ...(memorial ? [{ key: "guestbook" as const, label: "Lưu bút" }] : []),
  ];
  const { tab: tabParam } = await searchParams;
  const tab: Tab = tabs.some((t) => t.key === tabParam) ? (tabParam as Tab) : "overview";
  const tag = pet.qrTags[0];
  const url = tag ? publicPetUrl(tag.token) : null;
  const pendingGuestbook = guestbook.filter((g) => g.status === "pending").length;

  return (
    <>
      <nav className="mb-2 text-sm text-ink-soft">
        <Link href="/chu-nuoi" className="hover:underline">
          Các bé của bạn
        </Link>{" "}
        / <span className="text-ink">{pet.name}</span>
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-4xl font-bold">{pet.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
            <span className="font-mono">{pet.cardNo}</span>
            {memorial ? <Badge>Tưởng niệm</Badge> : null}
            {tag?.status === "locked" ? <Badge tone="danger">Mã đang khóa</Badge> : null}
          </p>
        </div>
        {url && tag?.status === "active" && !readOnly ? (
          <a href={url} target="_blank" rel="noopener" className="btn-outline">
            Xem trang của bé
          </a>
        ) : null}
      </div>

      {readOnly ? (
        <p className="mt-4 rounded-xl bg-sand px-4 py-3 text-sm">Hồ sơ đang được lưu trữ nên chỉ xem được. Nhắn Furever để mở lại.</p>
      ) : null}

      <nav className="mt-6 mb-6 flex gap-1 overflow-x-auto border-b border-sand" aria-label="Mục hồ sơ">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/chu-nuoi/${pet.id}?tab=${t.key}`}
            aria-current={tab === t.key ? "page" : undefined}
            className={`-mb-px flex min-h-11 shrink-0 items-center border-b-2 px-4 text-sm ${
              tab === t.key ? "border-sage font-semibold text-sage-deep" : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {t.label}
            {t.key === "guestbook" && pendingGuestbook ? (
              <span className="ml-1.5 rounded-full bg-rust px-1.5 text-[11px] font-semibold text-white">{pendingGuestbook}</span>
            ) : null}
          </Link>
        ))}
      </nav>

      <div className="space-y-6">
        {tab === "overview" ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Mã QR trên vòng cổ">
              {tag ? (
                <div className="space-y-3">
                  <p className="text-sm">
                    Trạng thái:{" "}
                    <strong>{tag.status === "active" ? "Đang hoạt động" : `Đang khóa${tag.lockReason ? ` (${tag.lockReason})` : ""}`}</strong>
                  </p>
                  {readOnly ? null : tag.status === "active" ? (
                    <>
                      <p className="text-sm text-ink-soft">
                        Mất vòng cổ? Khóa mã để người nhặt được vòng không xem được thông tin của bé. Mở lại khi tìm thấy.
                      </p>
                      <LockForm action={lockTagAction.bind(null, tag.id, pet.id)} />
                    </>
                  ) : (
                    <ConfirmButton
                      action={unlockTagAction.bind(null, tag.id, pet.id)}
                      confirmText="Mở khóa mã? Người quét sẽ thấy lại trang của bé."
                      className="btn-outline w-full"
                    >
                      Mở khóa mã
                    </ConfirmButton>
                  )}
                  <p className="text-xs text-ink-soft">Cần in vòng mới với mã khác, hãy nhắn cho Furever.</p>
                </div>
              ) : (
                <p className="text-sm text-ink-soft">Hồ sơ chưa có mã.</p>
              )}
            </Section>
            <Section title="Thông báo">
              <NotifyToggle petId={pet.id} enabled={pet.owner.notifyScan} email={pet.owner.email} />
            </Section>
            {!memorial ? (
              <Section title="Người nhặt được bé gửi về" description="Vị trí và lời nhắn chỉ bạn và Furever nhìn thấy.">
                <FoundReports reports={reports} />
              </Section>
            ) : null}
            <Section title="Lượt quét">
              <ScanList scans={scans.scans} count7d={scans.count7d} />
            </Section>
          </div>
        ) : null}

        {tab === "info" ? (
          <Section title="Mô tả của bé">
            <PublicInfoForm
              action={updatePublicInfoAction.bind(null, pet.id)}
              memorial={memorial}
              defaults={{
                tagline: pet.tagline ?? "",
                traits: pet.traits ?? "",
                note: pet.note ?? "",
                coatColor: pet.coatColor ?? "",
              }}
            />
          </Section>
        ) : null}

        {tab === "photos" ? (
          <Section title="Thư viện ảnh" description="Kéo thả để sắp xếp. Ảnh hiển thị theo thứ tự này trên trang của bé.">
            <PhotoManager
              petId={pet.id}
              photos={pet.media.map((m) => ({ id: m.id, url: m.url, thumbUrl: m.thumbUrl, caption: m.caption, isCover: m.isCover }))}
            />
          </Section>
        ) : null}

        {tab === "videos" ? (
          <>
            <Section title="Video">
              <VideoManager
                petId={pet.id}
                maxBytes={videoMaxBytes()}
                videos={pet.videos.map((v) => ({
                  id: v.id,
                  source: v.source,
                  title: v.title,
                  url: v.url,
                  posterUrl: v.posterUrl,
                  durationSec: v.durationSec,
                  sizeBytes: v.sizeBytes === null ? null : Number(v.sizeBytes),
                }))}
              />
            </Section>
            <Section title="Dán link YouTube hoặc Vimeo">
              <VideoLinkForm action={addVideoLinkAction.bind(null, pet.id)} />
            </Section>
          </>
        ) : null}

        {tab === "memories" ? (
          <Section title="Câu chuyện, kỷ niệm">
            {pet.memories.length ? (
              <ol className="mb-5 space-y-3">
                {pet.memories.map((m, i) => (
                  <li key={m.id} className="rounded-xl border border-sand bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{m.title}</p>
                        {m.memoryDate ? <p className="text-xs text-ink-soft">{formatDate(m.memoryDate)}</p> : null}
                      </div>
                      <div className="flex gap-1">
                        <form action={moveMemoryAction.bind(null, m.id, pet.id, -1)}>
                          <button className="btn-outline px-3" disabled={i === 0}>
                            Lên
                          </button>
                        </form>
                        <form action={moveMemoryAction.bind(null, m.id, pet.id, 1)}>
                          <button className="btn-outline px-3" disabled={i === pet.memories.length - 1}>
                            Xuống
                          </button>
                        </form>
                        <ConfirmButton
                          action={deleteMemoryAction.bind(null, m.id, pet.id)}
                          confirmText="Xóa kỷ niệm này?"
                          className="btn-danger"
                        >
                          Xóa
                        </ConfirmButton>
                      </div>
                    </div>
                    <p className="mt-2 text-sm whitespace-pre-line">{m.content}</p>
                  </li>
                ))}
              </ol>
            ) : null}
            <MemoryForm action={addMemoryAction.bind(null, pet.id)} />
          </Section>
        ) : null}

        {tab === "visibility" ? (
          <Section
            title="Hiển thị công khai khi quét mã"
            description="Bạn chọn điều gì người quét mã được thấy. Thay đổi có hiệu lực ngay."
          >
            <VisibilityForm
              action={saveVisibilityAction.bind(null, pet.id)}
              publicUrl={tag?.status === "active" ? url : null}
              initial={{
                showCallButton: pet.visibility?.showCallButton ?? false,
                showPhone: pet.visibility?.showPhone ?? false,
                showPhone2: pet.visibility?.showPhone2 ?? false,
                showArea: pet.visibility?.showArea ?? false,
                showAddress: pet.visibility?.showAddress ?? false,
                showNote: pet.visibility?.showNote ?? false,
                showMedia: pet.visibility?.showMedia ?? false,
                showMemories: pet.visibility?.showMemories ?? false,
                showGuestbook: pet.visibility?.showGuestbook ?? false,
              }}
            />
          </Section>
        ) : null}

        {tab === "guestbook" ? (
          <Section title="Sổ lưu bút" description="Lời nhắn chỉ hiện trên trang của bé sau khi bạn duyệt.">
            <GuestbookModeration
              petId={pet.id}
              entries={guestbook.map((g) => ({
                id: g.id,
                authorName: g.authorName,
                message: g.message,
                status: g.status,
                createdAt: g.createdAt.toISOString(),
              }))}
            />
          </Section>
        ) : null}
      </div>
    </>
  );
}
