"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ActionState } from "@/app/admin/actions";
import { ConflictError } from "@/lib/errors";
import { createOrderRequest } from "@/lib/services/online-orders";
import { clientIp, hashIp } from "@/lib/services/public-profile";
import { fieldErrors, formToObject, orderRequestSchema } from "@/lib/validation";

export async function createOrderAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const values: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string" && !k.startsWith("$")) values[k] = v;
  if (fd.get("website")) return { ok: false, message: "Không gửi được đơn." }; // bẫy bot
  const parsed = orderRequestSchema.safeParse(formToObject(fd, ["agree"]));
  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error), values, message: "Vui lòng kiểm tra các ô được đánh dấu." };
  }
  let target: string;
  try {
    const ipHash = hashIp(clientIp(await headers()));
    const res = await createOrderRequest(parsed.data, ipHash);
    target = `/dat-hang/${res.code}?t=${res.accessToken}`;
  } catch (e) {
    if (e instanceof ConflictError) return { ok: false, message: e.message, values };
    console.error(e);
    return { ok: false, message: "Chưa gửi được đơn, vui lòng thử lại.", values };
  }
  redirect(target);
}
