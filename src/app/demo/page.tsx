import type { Metadata } from "next";
import Link from "next/link";
import { PetPage } from "@/components/public/pet-page";
import type { PublicProfile } from "@/lib/services/public-profile";

export const metadata: Metadata = {
  title: "Trang Digital Memory mẫu",
  robots: { index: false, follow: true },
};

// FR-03: dữ liệu giả hoàn toàn, không chứa thông tin khách thật.
const DEMO: PublicProfile = {
  cardNo: "PMB-000000",
  name: "Mun",
  tagline: "Always in my heart",
  species: "dog",
  breed: "Golden Retriever",
  gender: "male",
  coatColor: "Vàng kem",
  traits: "Tai trái có đốm nâu, đeo vòng cổ màu xanh rêu",
  birthDate: "2021-03-14",
  lifeStatus: "alive",
  passedDate: null,
  coverUrl: null,
  coverThumbUrl: null,
  note: "Hiền, thích được gãi cằm. Hơi sợ tiếng xe máy.",
  memories: [
    {
      title: "Ngày đầu về nhà",
      date: "2021-05-02",
      content: "Mun ngủ quên trong chiếc giỏ đựng đồ ngay buổi tối đầu tiên, cả nhà không ai nỡ đánh thức.",
    },
    {
      title: "Chuyến đi biển đầu tiên",
      date: "2022-07-18",
      content: "Lần đầu thấy sóng, Mun sủa mãi rồi mới dám chạy theo. Về nhà cát dính đầy lông.",
    },
  ],
  contact: { callButton: true, phone: "0900000000", area: "Phường Bến Nghé, Quận 1, TP.HCM" },
  guestbookOpen: false,
};

export default function DemoPage() {
  return (
    <PetPage
      profile={DEMO}
      banner={
        <p className="bg-peach-soft px-4 py-2 text-center text-xs text-rust">
          Đây là trang mẫu với thông tin giả.{" "}
          <Link href="/" className="font-semibold underline">
            Về trang chủ
          </Link>
        </p>
      }
    />
  );
}
