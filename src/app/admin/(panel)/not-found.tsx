import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="card mx-auto mt-10 max-w-md p-8 text-center">
      <h1 className="text-2xl font-bold">Không tìm thấy</h1>
      <p className="mt-2 text-sm text-ink-soft">Hồ sơ hoặc trang này không tồn tại.</p>
      <Link href="/admin/pets" className="btn-outline mt-5">
        Về danh sách hồ sơ
      </Link>
    </div>
  );
}
