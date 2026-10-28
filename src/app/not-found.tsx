import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="animate-rise font-hand text-2xl text-rust">Ối, lạc đường rồi</p>
      <h1 className="animate-rise mt-2 text-3xl font-bold">Không tìm thấy trang</h1>
      <Link href="/" className="btn-outline mt-6">
        Về trang chủ
      </Link>
    </main>
  );
}
