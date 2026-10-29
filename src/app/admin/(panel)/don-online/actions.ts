"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { cancelOrder, convertOrderToPet, markOrderPaid } from "@/lib/services/online-orders";

async function run(fn: () => Promise<void>, ok: string): Promise<ActionState> {
  try {
    await fn();
  } catch (e) {
    if (e instanceof ConflictError || e instanceof NotFoundError) return { ok: false, message: e.message };
    console.error(e);
    return { ok: false, message: "Có lỗi xảy ra, vui lòng thử lại." };
  }
  revalidatePath("/admin", "layout");
  return { ok: true, message: ok };
}

export async function markPaidAction(id: string): Promise<ActionState> {
  const admin = await requireAdmin();
  return run(() => markOrderPaid(id, admin.id), "Đã xác nhận thanh toán và gửi email cho khách (nếu có email).");
}

export async function cancelOrderAction(id: string): Promise<ActionState> {
  const admin = await requireAdmin();
  return run(() => cancelOrder(id, admin.id), "Đã hủy đơn.");
}

export async function convertOrderAction(id: string): Promise<ActionState> {
  const admin = await requireAdmin();
  let petId = "";
  const res = await run(async () => {
    petId = await convertOrderToPet(id, admin.id);
  }, "Đã tạo hồ sơ.");
  if (!res.ok) return res;
  redirect(`/admin/pets/${petId}?created=1`);
}
