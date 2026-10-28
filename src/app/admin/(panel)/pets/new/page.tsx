import { PageHeader } from "@/components/admin/page-header";
import { nextCardNoPreview } from "@/lib/services/admin-data";
import { siteUrl } from "@/lib/site";
import { CreatePetForm } from "./create-pet-form";

export const metadata = { title: "Đăng ký mới" };

export default async function NewPetPage() {
  const nextCardNo = await nextCardNoPreview();
  return (
    <>
      <PageHeader
        crumbs={[{ href: "/admin/pets", label: "Hồ sơ thú cưng" }, { label: "Đăng ký mới" }]}
        title="Đăng ký thú cưng mới"
        description="Nhập thông tin khách gửi qua tin nhắn, lưu hồ sơ rồi phát hành mã QR để in lên mặt vòng cổ. Thư viện ảnh, video và kỷ niệm được thêm ở trang chi tiết sau khi lưu."
      />
      <CreatePetForm nextCardNo={nextCardNo} siteUrl={siteUrl()} />
    </>
  );
}
