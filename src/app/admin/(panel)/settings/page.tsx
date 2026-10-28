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
        description="Thông tin liên hệ trên landing page và chân trang. Mục nào để trống sẽ tự ẩn."
      />
      <div className="max-w-xl">
        <SettingsForm action={saveSettingsAction} defaults={settings} />
      </div>
    </>
  );
}
