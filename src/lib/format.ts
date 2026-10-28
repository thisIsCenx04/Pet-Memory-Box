const TZ = "Asia/Ho_Chi_Minh";

/** dd/mm/yyyy cho cột kiểu date (lưu ở UTC nửa đêm). */
export function formatDate(d: Date | null | undefined): string {
  if (!d) return "";
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
}

/** dd/mm/yyyy HH:mm theo giờ Việt Nam cho cột timestamptz (NFR-15). */
export function formatDateTime(d: Date | null | undefined): string {
  if (!d) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** yyyy-mm-dd cho <input type="date">. */
export function toDateInput(d: Date | null | undefined): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

export const SPECIES_LABEL = { dog: "Chó", cat: "Mèo", other: "Khác" } as const;
export const GENDER_LABEL = { male: "Đực", female: "Cái", unknown: "Chưa rõ" } as const;
export const QR_STATUS_LABEL = { active: "Đang hoạt động", locked: "Đã khóa", replaced: "Đã thay thế" } as const;
export const PET_STATUS_LABEL = { active: "Đang hiển thị", archived: "Đã lưu trữ" } as const;
export const PACKAGE_LABEL = { full_box: "Hộp đầy đủ", tag_only: "Chỉ vòng QR" } as const;
export const ORDER_STATUS_LABEL = {
  received: "Đã nhận",
  preparing: "Đang làm",
  issued: "Đã phát hành",
  delivered: "Đã giao",
} as const;
