import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/auth";
import { PasswordForm } from "./password-form";

export const metadata = { title: "Tài khoản admin" };

export default async function AccountPage() {
  const admin = await requireAdmin();
  return (
    <>
      <PageHeader title="Tài khoản admin" description={admin.email} />
      <div className="max-w-md">
        <PasswordForm />
      </div>
    </>
  );
}
