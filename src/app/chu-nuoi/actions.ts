"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  logoutOwner,
  normalizeEmail,
  requestOwnerOtp,
  requireOwnerPet,
  requirePetEditor,
  verifyOwnerOtp,
} from "@/lib/owner-auth";
import { moderateGuestbookEntry, setNotifyScan } from "@/lib/services/community";
import { audit } from "@/lib/services/audit";
import { clientIp, hashIp } from "@/lib/services/public-profile";
import { fieldErrors, formToObject } from "@/lib/validation";
import type { ActionState } from "@/app/admin/actions";

export type OtpState = ActionState & { step?: "email" | "code"; email?: string; sentAt?: number };

export async function requestOtpAction(_prev: OtpState, fd: FormData): Promise<OtpState> {
  const email = String(fd.get("email") ?? "");
  if (!z.email().safeParse(normalizeEmail(email)).success) {
    return { step: "email", errors: { email: ["Email không hợp lệ"] }, values: { email } };
  }
  const ipHash = hashIp(clientIp(await headers()));
  const res = await requestOwnerOtp(email, ipHash);
  if (!res.ok) return { step: "email", ok: false, message: res.message, values: { email } };
  return {
    step: "code",
    email: normalizeEmail(email),
    sentAt: Date.now(),
    ok: true,
    message: "Nếu email này đã được đăng ký cho bé, mã 6 số vừa được gửi tới hộp thư (có thể nằm trong mục Spam).",
  };
}

export async function verifyOtpAction(_prev: OtpState, fd: FormData): Promise<OtpState> {
  const email = String(fd.get("email") ?? "");
  const code = String(fd.get("code") ?? "");
  const res = await verifyOwnerOtp(email, code);
  if (!res.ok) return { step: "code", email, ok: false, message: res.message };
  redirect("/chu-nuoi");
}

export async function logoutOwnerAction() {
  await logoutOwner();
  redirect("/chu-nuoi/dang-nhap");
}

const publicInfoSchema = z.object({
  tagline: z.string().trim().max(80, "Tối đa 80 ký tự"),
  traits: z.string().trim().max(200, "Tối đa 200 ký tự"),
  note: z.string().trim().max(1000, "Tối đa 1.000 ký tự"),
  coatColor: z.string().trim().max(50, "Tối đa 50 ký tự"),
});

/** Chủ nuôi tự sửa các mục mô tả của bé. Tên, giống và thông tin liên hệ vẫn do admin sửa. */
export async function updatePublicInfoAction(petId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await requirePetEditor(petId);
  const parsed = publicInfoSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const d = parsed.data;
  await db.$transaction(async (tx) => {
    await tx.pet.update({
      where: { id: petId },
      data: {
        tagline: d.tagline || null,
        traits: d.traits || null,
        note: d.note || null,
        coatColor: d.coatColor || null,
        version: { increment: 1 },
      },
    });
    await audit(tx, actor, "update", "pet", petId, "chủ nuôi sửa mô tả");
  });
  revalidatePath(`/chu-nuoi/${petId}`);
  return { ok: true, message: "Đã lưu. Trang của bé cập nhật ngay." };
}

export async function setNotifyScanAction(petId: string, enabled: boolean): Promise<ActionState> {
  await requireOwnerPet(petId);
  await setNotifyScan(petId, enabled);
  revalidatePath(`/chu-nuoi/${petId}`);
  return { ok: true, message: enabled ? "Đã bật email khi có người quét mã." : "Đã tắt email khi có người quét mã." };
}

export async function moderateGuestbookAction(
  petId: string,
  entryId: string,
  decision: "approved" | "rejected" | "delete",
): Promise<ActionState> {
  const actor = await requirePetEditor(petId);
  await moderateGuestbookEntry(petId, entryId, decision, actor);
  revalidatePath(`/chu-nuoi/${petId}`);
  revalidatePath(`/admin/pets/${petId}`);
  return { ok: true };
}
