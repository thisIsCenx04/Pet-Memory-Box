import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { PetPage } from "@/components/public/pet-page";
import { resolvePublicRequest } from "@/lib/public-page";
import { logScan } from "@/lib/services/public-profile";

type Props = { params: Promise<{ token: string }> };

// FR-32: không lập chỉ mục, không nằm trong sitemap.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const r = await resolvePublicRequest(token);
  const name = !r.limited && r.lookup.result === "ok" ? r.lookup.profile.name : null;
  return {
    title: name ?? "Pet Memory Box",
    robots: { index: false, follow: false, nocache: true },
    referrer: "no-referrer",
  };
}

export default async function PublicPetPage({ params }: Props) {
  const { token } = await params;
  const r = await resolvePublicRequest(token);

  if (r.limited) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
        <h1 className="text-3xl font-bold">Thử lại sau ít phút</h1>
        <p className="mt-2 text-sm text-ink-soft">Có quá nhiều lượt mở trang từ thiết bị này trong một phút.</p>
      </main>
    );
  }

  const { lookup, ipHash, userAgent } = r;
  // UC-22: ghi lượt quét sau khi đã trả trang, không làm chậm người quét.
  after(() => logScan({ qrTagId: lookup.qrTagId, result: lookup.result, ipHash, userAgent }));

  // FR-31: mọi lý do (không tồn tại, khóa, thay thế, lưu trữ) đều trả cùng một trang 404.
  if (lookup.result !== "ok") notFound();

  return <PetPage profile={lookup.profile} />;
}
