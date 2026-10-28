"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { changePassword, login, logout, requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { saveSiteSettings, updateOrder } from "@/lib/services/admin-data";
import { createPet, setArchived, setLifeStatus, setVisibility, updatePet } from "@/lib/services/pets";
import { lockTag, reissueTag, unlockTag } from "@/lib/services/qr";
import {
  VISIBILITY_KEYS,
  createPetSchema,
  fieldErrors,
  formToObject,
  lockSchema,
  memorySchema,
  passwordSchema,
  settingsSchema,
  updatePetSchema,
  visibilitySchema,
  type FieldErrors,
} from "@/lib/validation";
import { parseVideoLink } from "@/lib/video-links";

// Mọi Server Action là một endpoint công khai: luôn gọi requireAdmin() trước (BR-08).

export type ActionState = {
  ok?: boolean;
  message?: string;
  errors?: FieldErrors;
  values?: Record<string, string>;
  duplicateOf?: { id: string; cardNo: string };
};

function rawValues(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string" && !k.startsWith("$")) out[k] = v;
  return out;
}

function failure(e: unknown): ActionState {
  if (e instanceof ConflictError || e instanceof NotFoundError) return { ok: false, message: e.message };
  console.error(e);
  return { ok: false, message: "Có lỗi xảy ra, dữ liệu chưa được lưu. Vui lòng thử lại." };
}

const petPath = (id: string) => `/admin/pets/${id}`;

// ---------- Xác thực ----------

export async function loginAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const email = String(fd.get("email") ?? "");
  const parsed = z
    .object({ email: z.email("Email không hợp lệ"), password: z.string().min(1, "Nhập mật khẩu") })
    .safeParse({ email: email.trim(), password: fd.get("password") ?? "" });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), values: { email } };

  const result = await login(parsed.data.email, parsed.data.password);
  if (!result.ok) {
    const message =
      result.reason === "locked"
        ? "Tài khoản tạm khóa do nhập sai nhiều lần. Thử lại sau 15 phút."
        : "Email hoặc mật khẩu không đúng";
    return { ok: false, message, values: { email } };
  }
  const next = String(fd.get("next") ?? "");
  // Chỉ quay lại đường dẫn nội bộ trong khu admin (UC-03 E3).
  redirect(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}

export async function changePasswordAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = passwordSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const res = await changePassword(admin, parsed.data.currentPassword, parsed.data.newPassword);
  if (!res.ok) return { ok: false, errors: { [res.field]: [res.message] } };
  return { ok: true, message: "Đã đổi mật khẩu. Các phiên đăng nhập khác đã bị đăng xuất." };
}

// ---------- Hồ sơ ----------

export async function createPetAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const values = rawValues(fd);
  const parsed = createPetSchema.safeParse(formToObject(fd, [...VISIBILITY_KEYS, "confirmDuplicate"]));
  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error), values, message: "Vui lòng kiểm tra các trường được đánh dấu." };
  }
  let id: string;
  try {
    const res = await createPet(parsed.data, admin.id);
    if (!res.ok) {
      return {
        ok: false,
        values,
        duplicateOf: res.duplicateOf,
        message: `Đã có hồ sơ ${res.duplicateOf.cardNo} cùng tên bé và số điện thoại. Đánh dấu xác nhận rồi lưu lần nữa nếu vẫn muốn tạo mới.`,
      };
    }
    id = res.id;
  } catch (e) {
    return { ...failure(e), values };
  }
  revalidatePath("/admin", "layout");
  redirect(`${petPath(id)}?created=1`);
}

export async function updatePetAction(petId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = updatePetSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), values: rawValues(fd) };
  try {
    await updatePet(petId, parsed.data, admin.id);
  } catch (e) {
    return { ...failure(e), values: rawValues(fd) };
  }
  revalidatePath(petPath(petId));
  return { ok: true, message: "Đã lưu thông tin hồ sơ." };
}

export async function saveVisibilityAction(petId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = visibilitySchema.safeParse(formToObject(fd, VISIBILITY_KEYS));
  if (!parsed.success) return { ok: false, message: "Cấu hình không hợp lệ" };
  try {
    await setVisibility(petId, parsed.data, admin.id);
  } catch (e) {
    return failure(e);
  }
  revalidatePath(petPath(petId));
  return { ok: true, message: "Đã lưu cấu hình hiển thị. Trang công khai cập nhật ngay." };
}

export async function setArchivedAction(petId: string, archived: boolean): Promise<ActionState> {
  const admin = await requireAdmin();
  try {
    await setArchived(petId, archived, admin.id);
  } catch (e) {
    return failure(e);
  }
  revalidatePath(petPath(petId));
  return { ok: true, message: archived ? "Đã lưu trữ hồ sơ." : "Đã khôi phục hồ sơ." };
}

export async function lifeStatusAction(petId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = z
    .object({ lifeStatus: z.enum(["alive", "memorial"]), passedDate: memorySchema.shape.memoryDate })
    .safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  try {
    await setLifeStatus(petId, parsed.data, admin.id);
  } catch (e) {
    return failure(e);
  }
  revalidatePath(petPath(petId));
  return {
    ok: true,
    message:
      parsed.data.lifeStatus === "memorial"
        ? "Đã chuyển sang trang tưởng niệm. Nút gọi và số điện thoại đã được ẩn."
        : "Đã chuyển về bé đang sống. Bật lại nút gọi trong mục Hiển thị công khai nếu cần.",
  };
}

// ---------- Mã QR ----------

export async function lockTagAction(qrId: string, petId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = lockSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  try {
    await lockTag(qrId, parsed.data.reason, admin.id);
  } catch (e) {
    return failure(e);
  }
  revalidatePath(petPath(petId));
  return { ok: true, message: "Đã khóa mã. Quét mã sẽ không còn thấy thông tin của bé." };
}

export async function unlockTagAction(qrId: string, petId: string): Promise<ActionState> {
  const admin = await requireAdmin();
  try {
    await unlockTag(qrId, admin.id);
  } catch (e) {
    return failure(e);
  }
  revalidatePath(petPath(petId));
  return { ok: true, message: "Đã mở khóa mã." };
}

export async function reissueTagAction(petId: string): Promise<ActionState> {
  const admin = await requireAdmin();
  try {
    await reissueTag(petId, admin.id);
  } catch (e) {
    return failure(e);
  }
  revalidatePath(petPath(petId));
  return { ok: true, message: "Đã phát hành mã mới. Hãy tải QR mới để in lên vòng." };
}

// ---------- Đơn hàng ----------

const orderSchema = z.object({
  package: z.enum(["full_box", "tag_only"]),
  status: z.enum(["received", "preparing", "issued", "delivered"]),
  note: z
    .string()
    .trim()
    .max(1000, "Tối đa 1.000 ký tự")
    .transform((v) => v || null),
});

export async function updateOrderAction(orderId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = orderSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  try {
    await updateOrder(orderId, parsed.data, admin.id);
  } catch (e) {
    return failure(e);
  }
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Đã lưu đơn hàng." };
}

// ---------- Kỷ niệm và link video ----------

export async function addMemoryAction(petId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = memorySchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), values: rawValues(fd) };
  const last = await db.memory.aggregate({ where: { petId }, _max: { sortOrder: true } });
  await db.memory.create({
    data: { petId, ...parsed.data, sortOrder: (last._max.sortOrder ?? -1) + 1 },
  });
  revalidatePath(petPath(petId));
  return { ok: true, message: "Đã thêm kỷ niệm." };
}

export async function deleteMemoryAction(memoryId: string, petId: string): Promise<ActionState> {
  await requireAdmin();
  await db.memory.deleteMany({ where: { id: memoryId, petId } });
  revalidatePath(petPath(petId));
  return { ok: true, message: "Đã xóa kỷ niệm." };
}

export async function moveMemoryAction(memoryId: string, petId: string, direction: -1 | 1): Promise<void> {
  await requireAdmin();
  const list = await db.memory.findMany({ where: { petId }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  const i = list.findIndex((m) => m.id === memoryId);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await db.$transaction(list.map((m, idx) => db.memory.update({ where: { id: m.id }, data: { sortOrder: idx } })));
  revalidatePath(petPath(petId));
}

export async function addVideoLinkAction(petId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const link = parseVideoLink(String(fd.get("url") ?? ""));
  const title = String(fd.get("title") ?? "").trim().slice(0, 100) || null;
  if (!link) {
    return {
      ok: false,
      errors: { url: ["Chỉ nhận liên kết https từ youtube.com, youtu.be hoặc vimeo.com"] },
      values: rawValues(fd),
    };
  }
  const last = await db.video.aggregate({ where: { petId }, _max: { sortOrder: true } });
  await db.video.create({
    data: { petId, source: link.source, url: link.embedUrl, title, sortOrder: (last._max.sortOrder ?? -1) + 1 },
  });
  revalidatePath(petPath(petId));
  return { ok: true, message: "Đã thêm video." };
}

export async function deleteVideoAction(videoId: string, petId: string): Promise<ActionState> {
  await requireAdmin();
  const video = await db.video.findFirst({ where: { id: videoId, petId } });
  if (!video) return { ok: false, message: "Video không tồn tại" };
  if (video.source === "upload") {
    // Xóa tệp trên Storage được thêm cùng chức năng tải video lên.
    return { ok: false, message: "Chưa hỗ trợ xóa video tải lên ở phiên bản này." };
  }
  await db.video.delete({ where: { id: videoId } });
  revalidatePath(petPath(petId));
  return { ok: true, message: "Đã xóa video." };
}

// ---------- Cài đặt ----------

export async function saveSettingsAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = settingsSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), values: rawValues(fd) };
  await saveSiteSettings(parsed.data, admin.id);
  revalidatePath("/");
  return { ok: true, message: "Đã lưu cài đặt." };
}
