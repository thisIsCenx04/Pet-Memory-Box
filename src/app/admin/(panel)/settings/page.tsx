import { PageHeader } from "@/components/admin/page-header";
import { saveSettingsAction } from "@/app/admin/actions";
import { getSiteSettings } from "@/lib/services/admin-data";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Cài đặt trang web" };

export default async function SettingsPage() {
  const settings = await getSiteSettings();
  return (
    <>
      <PageHeader
        title="Cài đặt trang web"
        description="Liên kết nhắn tin trên landing page. Nút tương ứng tự ẩn khi để trống."
      />
      <div className="max-w-xl">
        <SettingsForm action={saveSettingsAction} defaults={settings} />
      </div>
    </>
  );
}
