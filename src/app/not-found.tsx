import Link from "next/link";
import { PawMark } from "@/components/paw-logo";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <PawMark className="h-14 w-14 text-sand-deep" />
      <h1 className="mt-4 text-3xl font-bold">Không tìm thấy trang</h1>
      <Link href="/" className="btn-outline mt-6">
        Về trang chủ
      </Link>
    </main>
  );
}
