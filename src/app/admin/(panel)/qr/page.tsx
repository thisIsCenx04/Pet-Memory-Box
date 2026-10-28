import Link from "next/link";
import { Badge, PageHeader } from "@/components/admin/page-header";
import { QR_STATUS_LABEL, formatDateTime } from "@/lib/format";
import { listQrTags } from "@/lib/services/admin-data";

export const metadata = { title: "Mã QR đã phát hành" };

export default async function QrPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const filter = status === "active" || status === "locked" || status === "replaced" ? status : undefined;
  const tags = await listQrTags(filter);
  return (
    <>
      <PageHeader title="Mã QR đã phát hành" description="100 mã gần nhất. Khóa và phát hành lại mã trong trang chi tiết hồ sơ." />
      <nav className="mb-4 flex flex-wrap gap-2" aria-label="Lọc theo trạng thái">
        {[undefined, "active", "locked", "replaced"].map((s) => (
          <Link
            key={s ?? "all"}
            href={s ? `/admin/qr?status=${s}` : "/admin/qr"}
            className={filter === s ? "btn-primary" : "btn-outline"}
          >
            {s ? QR_STATUS_LABEL[s as keyof typeof QR_STATUS_LABEL] : "Tất cả"}
          </Link>
        ))}
      </nav>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-sand text-left">
              {["Mã thẻ", "Tên bé", "Chủ nuôi", "Trạng thái", "Lượt quét", "Phát hành"].map((h) => (
                <th key={h} scope="col" className="eyebrow px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-sand">
            {tags.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-3 font-mono">
                  <Link href={`/admin/pets/${t.pet.id}?tab=qr`} className="hover:underline">
                    {t.pet.cardNo}
                  </Link>
                </td>
                <td className="px-4 py-3 font-semibold">{t.pet.name}</td>
                <td className="px-4 py-3">{t.pet.owner.fullName}</td>
                <td className="px-4 py-3">
                  <Badge tone={t.status === "active" ? "sage" : t.status === "locked" ? "danger" : "sand"}>
                    {QR_STATUS_LABEL[t.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3">{t._count.scans}</td>
                <td className="px-4 py-3 text-ink-soft">{formatDateTime(t.issuedAt)}</td>
              </tr>
            ))}
            {tags.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink-soft">
                  Chưa có mã nào.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
