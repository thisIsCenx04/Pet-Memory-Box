import Link from "next/link";

// S-04: không nêu lý do để không lộ việc mã từng tồn tại (UC-21 A1).
export default function TagUnavailable() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="animate-rise font-hand text-2xl text-rust">Furever</p>
      <h1 className="animate-rise mt-2 text-3xl font-bold">Mã này hiện không khả dụng</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Nếu bạn vừa nhặt được một bé thú cưng, hãy giữ bé ở nơi an toàn và liên hệ Furever để được hỗ trợ.
      </p>
      <Link href="/#lien-he" className="btn-primary mt-6">
        Liên hệ Furever
      </Link>
    </main>
  );
}
