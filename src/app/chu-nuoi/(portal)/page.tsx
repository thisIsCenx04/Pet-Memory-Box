import Link from "next/link";
import { Badge } from "@/components/admin/page-header";
import { requireOwner } from "@/lib/owner-auth";
import { listOwnerPets } from "@/lib/services/owner-portal";

export const metadata = { title: "Các bé của bạn" };

export default async function OwnerHome() {
  const owner = await requireOwner();
  const pets = await listOwnerPets(owner.email);
  return (
    <>
      <h1 className="animate-rise text-3xl font-bold">Các bé của bạn</h1>
      <p className="mt-1 text-sm text-ink-soft">Thêm ảnh, video, kỷ niệm và theo dõi khi có người quét mã trên vòng cổ.</p>
      {pets.length === 0 ? (
        <div className="card mt-8 p-8 text-center">
          <p className="font-semibold">Chưa có bé nào gắn với email {owner.email}</p>
          <p className="mt-1 text-sm text-ink-soft">Nhắn cho Furever để thêm email này vào hồ sơ của bé.</p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {pets.map((p) => {
            const tag = p.qrTags[0];
            const cover = p.media[0];
            return (
              <li key={p.id}>
                <Link href={`/chu-nuoi/${p.id}`} className="card lift flex gap-4 p-4">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-sand">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover.thumbUrl ?? cover.url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full items-center justify-center font-heading text-4xl font-bold text-rust/60">
                        {p.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-heading text-2xl font-bold">{p.name}</p>
                    <p className="font-mono text-xs text-ink-soft">{p.cardNo}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {p.lifeStatus === "memorial" ? <Badge>Tưởng niệm</Badge> : null}
                      {tag?.status === "locked" ? <Badge tone="danger">Mã đang khóa</Badge> : null}
                      {p.status === "archived" ? <Badge>Đã lưu trữ</Badge> : null}
                      {p._count.foundReports ? <Badge tone="peach">{p._count.foundReports} tin báo tìm thấy</Badge> : null}
                      {p._count.guestbook ? <Badge tone="peach">{p._count.guestbook} lời nhắn chờ duyệt</Badge> : null}
                    </div>
                    <p className="mt-2 text-xs text-ink-soft">{p.scans7d} lượt quét trong 7 ngày</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
