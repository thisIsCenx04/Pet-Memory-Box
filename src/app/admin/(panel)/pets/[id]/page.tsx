import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addMemoryAction,
  addVideoLinkAction,
  deleteMemoryAction,
  lifeStatusAction,
  lockTagAction,
  moveMemoryAction,
  reissueTagAction,
  saveVisibilityAction,
  setArchivedAction,
  unlockTagAction,
  updateOrderAction,
  updatePetAction,
} from "@/app/admin/actions";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { PhotoManager } from "@/components/admin/photo-manager";
import { VideoManager } from "@/components/admin/video-manager";
import { Badge, PageHeader } from "@/components/admin/page-header";
import { Section } from "@/components/form";
import {
  GENDER_LABEL,
  ORDER_STATUS_LABEL,
  PACKAGE_LABEL,
  QR_STATUS_LABEL,
  SPECIES_LABEL,
  formatDate,
  formatDateTime,
  toDateInput,
} from "@/lib/format";
import { FoundReports, ScanList } from "@/components/owner/activity";
import { GuestbookModeration } from "@/components/owner/guestbook-moderation";
import { listFoundReports, listGuestbook, recentScans } from "@/lib/services/community";
import { videoMaxBytes } from "@/lib/services/media";
import { getPetDetail } from "@/lib/services/pets";
import { renderQrDataUrl } from "@/lib/services/qr";
import { publicPetUrl } from "@/lib/site";
import { EditPetForm, LifeStatusForm, LockForm, MemoryForm, OrderForm, VideoLinkForm, VisibilityForm } from "./forms";

const TABS = [
  { key: "info", label: "Thông tin" },
  { key: "visibility", label: "Hiển thị công khai" },
  { key: "photos", label: "Ảnh" },
  { key: "videos", label: "Video" },
  { key: "memories", label: "Kỷ niệm" },
  { key: "community", label: "Báo tìm & lưu bút" },
  { key: "qr", label: "Mã QR và đơn hàng" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const ACTION_LABEL: Record<string, string> = {
  create: "Tạo hồ sơ",
  update: "Cập nhật",
  lock: "Khóa mã",
  unlock: "Mở khóa mã",
  reissue: "Phát hành lại mã",
  archive: "Lưu trữ",
  restore: "Khôi phục",
  memorial: "Đổi chế độ tưởng niệm",
  password_change: "Đổi mật khẩu",
};

const DETAIL_LABEL: Record<string, string> = {
  memorial: "sang trang tưởng niệm",
  alive: "về bé đang sống",
  visibility: "cấu hình hiển thị",
  details: "thông tin đơn",
};

export default async function PetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; created?: string; coverFailed?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const pet = await getPetDetail(id);
  if (!pet) notFound();

  const tab: TabKey = TABS.some((t) => t.key === sp.tab) ? (sp.tab as TabKey) : sp.created ? "qr" : "info";
  const current = pet.qrTags.find((t) => t.status !== "replaced") ?? null;
  const url = current ? publicPetUrl(current.token) : null;
  const qrDataUrl = url ? await renderQrDataUrl(url) : null;
  const order = pet.orders[0];
  const visible = current?.status === "active" && pet.status === "active";

  return (
    <>
      <PageHeader
        crumbs={[{ href: "/admin/pets", label: "Hồ sơ thú cưng" }, { label: pet.cardNo }]}
        title={pet.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono">{pet.cardNo}</span>
            <span>·</span>
            <span>
              {SPECIES_LABEL[pet.species]}
              {pet.breed ? ` ${pet.breed}` : ""} · {GENDER_LABEL[pet.gender]}
            </span>
            {pet.status === "archived" ? <Badge>Đã lưu trữ</Badge> : null}
            {pet.lifeStatus === "memorial" ? <Badge tone="peach">Tưởng niệm</Badge> : null}
            {current ? (
              <Badge tone={current.status === "active" ? "sage" : "danger"}>Mã {QR_STATUS_LABEL[current.status].toLowerCase()}</Badge>
            ) : null}
          </span>
        }
        actions={
          url && visible ? (
            <a href={url} target="_blank" rel="noopener" className="btn-outline">
              Xem trang công khai
            </a>
          ) : null
        }
      />

      {sp.coverFailed ? (
        <p role="alert" className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          Chưa lưu được ảnh đại diện. Vào tab Ảnh để tải lại.
        </p>
      ) : null}

      {sp.created ? (
        <p role="status" className="mb-4 rounded-xl bg-sage-soft px-4 py-3 text-sm text-sage-deep">
          Đã lưu hồ sơ và phát hành mã {pet.cardNo}. Tải QR bên dưới để in lên vòng, sau đó thêm ảnh, video và kỷ niệm.
        </p>
      ) : null}

      <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-sand" aria-label="Mục hồ sơ">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/pets/${pet.id}?tab=${t.key}`}
            aria-current={tab === t.key ? "page" : undefined}
            className={`-mb-px flex min-h-11 shrink-0 items-center border-b-2 px-4 text-sm ${
              tab === t.key ? "border-sage font-semibold text-sage-deep" : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          {tab === "info" ? (
            <Section title="Thông tin bé và chủ nuôi">
              <EditPetForm
                action={updatePetAction.bind(null, pet.id)}
                defaults={{
                  version: String(pet.version),
                  lifeStatus: pet.lifeStatus,
                  name: pet.name,
                  species: pet.species,
                  breed: pet.breed ?? "",
                  gender: pet.gender,
                  birthDate: toDateInput(pet.birthDate),
                  passedDate: toDateInput(pet.passedDate),
                  coatColor: pet.coatColor ?? "",
                  traits: pet.traits ?? "",
                  note: pet.note ?? "",
                  tagline: pet.tagline ?? "",
                  ownerName: pet.owner.fullName,
                  phone: pet.owner.phone,
                  phone2: pet.owner.phone2 ?? "",
                  zaloMessenger: pet.owner.zaloMessenger ?? "",
                  area: pet.owner.area ?? "",
                  address: pet.owner.address ?? "",
                  ownerEmail: pet.owner.email ?? "",
                }}
              />
            </Section>
          ) : null}

          {tab === "visibility" ? (
            <Section
              title="Hiển thị công khai khi quét mã"
              description="Chỉ mục được bật mới có trong dữ liệu gửi tới trình duyệt người quét. Thay đổi có hiệu lực ngay."
            >
              <VisibilityForm
                action={saveVisibilityAction.bind(null, pet.id)}
                publicUrl={visible ? url : null}
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

          {tab === "photos" ? (
            <Section title="Thư viện ảnh" description="Kéo thả để sắp xếp. Ảnh hiển thị theo thứ tự này trên trang của bé.">
              <PhotoManager
                petId={pet.id}
                photos={pet.media.map((m) => ({
                  id: m.id,
                  url: m.url,
                  thumbUrl: m.thumbUrl,
                  caption: m.caption,
                  isCover: m.isCover,
                }))}
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
              <Section title="Dán link YouTube hoặc Vimeo" description="Dùng cho video dài; không tính vào giới hạn video tải lên.">
                <VideoLinkForm action={addVideoLinkAction.bind(null, pet.id)} />
              </Section>
            </>
          ) : null}

          {tab === "community" ? (
            <CommunityTab petId={pet.id} memorial={pet.lifeStatus === "memorial"} />
          ) : null}

          {tab === "memories" ? (
            <Section title="Câu chuyện, kỷ niệm" description="Nội dung hiển thị dạng văn bản thuần, không chạy mã HTML.">
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
                            <button className="btn-outline px-3" disabled={i === 0} >
                              Lên
                            </button>
                          </form>
                          <form action={moveMemoryAction.bind(null, m.id, pet.id, 1)}>
                            <button
                              className="btn-outline px-3"
                              disabled={i === pet.memories.length - 1}
                              >
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

          {tab === "qr" ? (
            <>
              <Section title="Lịch sử mã QR">
                <ul className="divide-y divide-sand text-sm">
                  {pet.qrTags.map((t) => (
                    <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                      <span className="font-mono text-xs">{t.token.slice(0, 6)}…</span>
                      <Badge tone={t.status === "active" ? "sage" : t.status === "locked" ? "danger" : "sand"}>
                        {QR_STATUS_LABEL[t.status]}
                      </Badge>
                      <span className="text-ink-soft">Phát hành {formatDateTime(t.issuedAt)}</span>
                      {t.lockReason ? <span className="text-ink-soft">Lý do khóa: {t.lockReason}</span> : null}
                    </li>
                  ))}
                </ul>
              </Section>
              <Section title="Nhật ký thao tác">
                {pet.history.length ? (
                  <ul className="divide-y divide-sand text-sm">
                    {pet.history.map((h) => (
                      <li key={String(h.id)} className="flex flex-wrap gap-x-3 py-2">
                        <span className="w-36 text-ink-soft">{formatDateTime(h.createdAt)}</span>
                        <span className="font-semibold">{ACTION_LABEL[h.action] ?? h.action}</span>
                        {h.detail ? <span className="text-ink-soft">{DETAIL_LABEL[h.detail] ?? h.detail}</span> : null}
                        <span className="ml-auto text-xs text-ink-soft">{h.admin?.email ?? `Chủ nuôi ${h.actorEmail ?? ""}`}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-ink-soft">Chưa có thao tác nào.</p>
                )}
              </Section>
            </>
          ) : null}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <div className="card p-5">
            <p className="eyebrow">Mã QR</p>
            {current && qrDataUrl && url ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt={`Mã QR của ${pet.name}`}
                  width={320}
                  height={320}
                  className={`mx-auto mt-3 w-48 rounded-xl border border-sand ${current.status !== "active" ? "opacity-40" : ""}`}
                />
                <p className="mt-3 rounded-xl bg-cream px-3 py-2 font-mono text-xs break-all text-ink-soft">{url}</p>
                {current.status !== "active" ? (
                  <p className="mt-2 text-xs font-semibold text-danger">
                    Mã đang bị khóa: quét sẽ chỉ thấy thông báo mã không khả dụng.
                  </p>
                ) : null}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <a className="btn-primary" href={`/api/admin/pets/${pet.id}/qr?format=png`} download>
                    Tải PNG
                  </a>
                  <a className="btn-outline" href={`/api/admin/pets/${pet.id}/qr?format=svg`} download>
                    Tải SVG
                  </a>
                </div>
                <div className="mt-4 space-y-2">
                  {current.status === "active" ? (
                    <LockForm action={lockTagAction.bind(null, current.id, pet.id)} />
                  ) : (
                    <ConfirmButton
                      action={unlockTagAction.bind(null, current.id, pet.id)}
                      confirmText="Mở khóa mã? Người quét sẽ thấy lại trang của bé."
                      className="btn-outline w-full"
                    >
                      Mở khóa mã
                    </ConfirmButton>
                  )}
                  {pet.status === "active" ? (
                    <ConfirmButton
                      action={reissueTagAction.bind(null, pet.id)}
                      confirmText="Phát hành mã mới? Mã cũ ngừng hoạt động vĩnh viễn và vòng cổ cũ không dùng được nữa."
                      className="btn-outline w-full"
                    >
                      Phát hành lại mã
                    </ConfirmButton>
                  ) : null}
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-ink-soft">Hồ sơ chưa có mã QR.</p>
            )}
          </div>

          {order ? (
            <div className="card p-5">
              <p className="eyebrow mb-1">Đơn hàng</p>
              <p className="mb-3 text-xs text-ink-soft">
                {PACKAGE_LABEL[order.package]} · {ORDER_STATUS_LABEL[order.status]} từ {formatDateTime(order.statusChangedAt)}
              </p>
              <OrderForm
                action={updateOrderAction.bind(null, order.id)}
                defaults={{ package: order.package, status: order.status, note: order.note ?? "" }}
              />
            </div>
          ) : null}

          <div className="card space-y-3 p-5">
            <p className="eyebrow">Trạng thái hồ sơ</p>
            <LifeStatusForm
              action={lifeStatusAction.bind(null, pet.id)}
              lifeStatus={pet.lifeStatus}
              passedDate={toDateInput(pet.passedDate)}
            />
            {pet.status === "active" ? (
              <ConfirmButton
                action={setArchivedAction.bind(null, pet.id, true)}
                confirmText="Lưu trữ hồ sơ? Trang công khai sẽ ngừng hiển thị, dữ liệu vẫn được giữ."
                className="btn-danger w-full"
              >
                Lưu trữ hồ sơ
              </ConfirmButton>
            ) : (
              <ConfirmButton
                action={setArchivedAction.bind(null, pet.id, false)}
                confirmText="Khôi phục hồ sơ? Mã đang bị khóa sẽ không tự mở khóa."
                className="btn-outline w-full"
              >
                Khôi phục hồ sơ
              </ConfirmButton>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}

async function CommunityTab({ petId, memorial }: { petId: string; memorial: boolean }) {
  const [reports, scans, guestbook] = await Promise.all([listFoundReports(petId), recentScans(petId), listGuestbook(petId)]);
  return (
    <>
      <Section title="Người nhặt được bé gửi về">
        <FoundReports reports={reports} />
      </Section>
      <Section title="Lượt quét 30 ngày">
        <ScanList scans={scans.scans} count7d={scans.count7d} />
      </Section>
      <Section
        title="Sổ lưu bút"
        description={memorial ? "Lời nhắn chỉ hiện trên trang sau khi được duyệt." : "Sổ lưu bút chỉ mở khi hồ sơ ở chế độ tưởng niệm."}
      >
        <GuestbookModeration
          petId={petId}
          entries={guestbook.map((g) => ({
            id: g.id,
            authorName: g.authorName,
            message: g.message,
            status: g.status,
            createdAt: g.createdAt.toISOString(),
          }))}
        />
      </Section>
    </>
  );
}
