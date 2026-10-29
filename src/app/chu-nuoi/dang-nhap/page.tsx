import { redirect } from "next/navigation";
import Link from "next/link";
import { Wordmark } from "@/components/paw-logo";
import { getCurrentOwner } from "@/lib/owner-auth";
import { OtpForm } from "./otp-form";

export const metadata = { title: "Đăng nhập" };

export default async function OwnerLoginPage() {
  if (await getCurrentOwner()) redirect("/chu-nuoi");
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Link href="/">
            <Wordmark />
          </Link>
        </div>
        <div className="card animate-rise p-6 sm:p-8">
          <h1 className="text-2xl font-bold">Trang của chủ nuôi</h1>
          <p className="mt-1 mb-6 text-sm text-ink-soft">
            Đăng nhập bằng email bạn đã gửi cho Furever khi đặt hộp. Không cần mật khẩu, chúng mình sẽ gửi mã 6 số.
          </p>
          <OtpForm />
        </div>
      </div>
    </main>
  );
}
