import { z } from "zod";
import { normalizeVnPhone } from "./phone";

// Quy tắc kiểm tra dữ liệu (SRS v2, mục 10.2). Dùng chung cho Server Action và Route Handler.

const text = (max: number) => z.string().trim().max(max, `Tối đa ${max} ký tự`);

/** Ô không bắt buộc có thể vắng mặt trong FormData (ví dụ ô bị ẩn): coi như chuỗi rỗng. */
const blank = <T extends z.ZodType>(schema: T) => z.preprocess((v) => (v == null ? "" : v), schema);

const optionalText = (max: number) => blank(text(max).transform((v) => (v === "" ? null : v)));

const requiredText = (min: number, max: number, label: string) =>
  text(max).min(min, min <= 1 ? `${label} là bắt buộc` : `${label} cần từ ${min} ký tự`);

/** Nhận yyyy-mm-dd (input date) hoặc dd/mm/yyyy; trả Date ở UTC nửa đêm hoặc null. */
const optionalPastDate = blank(
  z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (v === "") return null;
      let y: number, m: number, d: number;
      const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
      const vn = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
      if (iso) [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
      else if (vn) [y, m, d] = [Number(vn[3]), Number(vn[2]), Number(vn[1])];
      else {
        ctx.addIssue({ code: "custom", message: "Ngày không đúng định dạng dd/mm/yyyy" });
        return z.NEVER;
      }
      const date = new Date(Date.UTC(y, m - 1, d));
      if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
        ctx.addIssue({ code: "custom", message: "Ngày không tồn tại" });
        return z.NEVER;
      }
      if (date.getTime() > Date.now()) {
        ctx.addIssue({ code: "custom", message: "Ngày không được ở tương lai" });
        return z.NEVER;
      }
      return date;
    }),
);

const phone = (required: boolean) =>
  blank(
    z
      .string()
      .trim()
      .transform((v, ctx) => {
        if (v === "") {
          if (required) ctx.addIssue({ code: "custom", message: "Số điện thoại là bắt buộc" });
          return null;
        }
        const n = normalizeVnPhone(v);
        if (!n) {
          ctx.addIssue({ code: "custom", message: "Số điện thoại gồm 10 chữ số, bắt đầu bằng 0 hoặc +84" });
          return z.NEVER;
        }
        return n;
      }),
  );

const zaloMessenger = blank(
  z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (v === "") return null;
      const asPhone = normalizeVnPhone(v);
      if (asPhone) return asPhone;
      try {
        const url = new URL(v);
        if (url.protocol === "https:") return url.toString();
      } catch {}
      ctx.addIssue({ code: "custom", message: "Nhập số Zalo hoặc đường dẫn https" });
      return z.NEVER;
    }),
);

export const petFieldsSchema = z.object({
  name: requiredText(1, 50, "Tên bé"),
  species: z.enum(["dog", "cat", "other"], "Chọn loài"),
  breed: optionalText(50),
  gender: z.enum(["male", "female", "unknown"], "Chọn giới tính"),
  birthDate: optionalPastDate,
  coatColor: optionalText(50),
  traits: optionalText(200),
  note: optionalText(1000),
  tagline: optionalText(80),
  lifeStatus: z.enum(["alive", "memorial"]),
  passedDate: optionalPastDate,
});

export const ownerFieldsSchema = z.object({
  ownerName: requiredText(2, 80, "Họ tên chủ nuôi"),
  phone: phone(true),
  phone2: phone(false),
  zaloMessenger,
  area: optionalText(100),
  address: optionalText(200),
});

export const visibilitySchema = z.object({
  showCallButton: z.boolean(),
  showPhone: z.boolean(),
  showPhone2: z.boolean(),
  showArea: z.boolean(),
  showAddress: z.boolean(),
  showNote: z.boolean(),
  showMedia: z.boolean(),
  showMemories: z.boolean(),
});

export const VISIBILITY_KEYS = Object.keys(visibilitySchema.shape) as (keyof Visibility)[];

export const orderFieldsSchema = z.object({
  package: z.enum(["full_box", "tag_only"], "Chọn gói sản phẩm"),
  orderNote: optionalText(1000),
});

function checkPassedDate<T extends { birthDate: Date | null; passedDate: Date | null; lifeStatus: string }>(
  v: T,
  ctx: z.RefinementCtx,
) {
  if (v.lifeStatus !== "memorial" && v.passedDate) {
    v.passedDate = null;
  }
  if (v.birthDate && v.passedDate && v.passedDate < v.birthDate) {
    ctx.addIssue({ code: "custom", path: ["passedDate"], message: "Ngày mất không được trước ngày sinh" });
  }
}

export const createPetSchema = petFieldsSchema
  .extend(ownerFieldsSchema.shape)
  .extend(visibilitySchema.shape)
  .extend(orderFieldsSchema.shape)
  .extend({ confirmDuplicate: z.boolean() })
  .superRefine(checkPassedDate);

export const updatePetSchema = petFieldsSchema
  .extend(ownerFieldsSchema.shape)
  .extend({ version: z.coerce.number().int().positive() })
  .superRefine(checkPassedDate);

export type Visibility = z.infer<typeof visibilitySchema>;
export type CreatePetInput = z.infer<typeof createPetSchema>;
export type UpdatePetInput = z.infer<typeof updatePetSchema>;

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Nhập mật khẩu hiện tại"),
    newPassword: z.string().min(8, "Mật khẩu mới cần từ 8 ký tự").max(200),
    confirmPassword: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.newPassword !== v.confirmPassword)
      ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "Mật khẩu xác nhận không khớp" });
    if (v.newPassword === v.currentPassword)
      ctx.addIssue({ code: "custom", path: ["newPassword"], message: "Mật khẩu mới phải khác mật khẩu cũ" });
  });

export const memorySchema = z.object({
  title: requiredText(1, 100, "Tiêu đề"),
  memoryDate: optionalPastDate,
  content: requiredText(1, 5000, "Nội dung"),
});

export const lockSchema = z.object({ reason: requiredText(1, 200, "Lý do khóa") });

const optionalHttps = blank(z.union([z.literal(""), z.url({ protocol: /^https$/, error: "Cần đường dẫn https" })]));

export const settingsSchema = z.object({
  zalo_url: optionalHttps,
  messenger_url: optionalHttps,
  facebook_url: optionalHttps,
  tiktok_url: optionalHttps,
  contact_email: blank(z.union([z.literal(""), z.email("Email không hợp lệ")])),
  hotline: blank(
    z
      .string()
      .trim()
      .transform((v, ctx) => {
        if (v === "") return "";
        const n = normalizeVnPhone(v);
        if (!n) {
          ctx.addIssue({ code: "custom", message: "Số điện thoại gồm 10 chữ số, bắt đầu bằng 0 hoặc +84" });
          return z.NEVER;
        }
        return n;
      }),
  ),
  service_area: blank(z.string().trim().max(120, "Tối đa 120 ký tự")),
});

/** Chuyển FormData thành object; các khóa trong `booleans` thành true khi ô được chọn. */
export function formToObject(fd: FormData, booleans: readonly string[] = []) {
  const obj: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string" && !k.startsWith("$")) obj[k] = v;
  }
  for (const k of booleans) obj[k] = fd.get(k) === "on";
  return obj;
}

export type FieldErrors = Record<string, string[] | undefined>;

export function fieldErrors(error: z.ZodError): FieldErrors {
  return z.flattenError(error).fieldErrors as FieldErrors;
}
