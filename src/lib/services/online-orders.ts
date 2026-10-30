import "server-only";
import { randomInt } from "node:crypto";
import QRCode from "qrcode";
import type { OrderRequestStatus } from "@/generated/prisma/enums";
import { db } from "../db";
import { ConflictError, NotFoundError, isUniqueViolation } from "../errors";
import { PACKAGE_LABEL } from "../format";
import { sendMail } from "../mail";
import { siteUrl } from "../site";
import { generatePublicToken } from "../tokens";
import type { OrderRequestInput } from "../validation";
import { BANKS, buildVietQrPayload } from "../vietqr";
import { getSiteSettingsSafe } from "./admin-data";
import { audit } from "./audit";
import { createPet } from "./pets";

// Đơn khách tự đặt trên web và thanh toán bằng VietQR (chuyển khoản, admin xác nhận khi tiền về).

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // bỏ ký tự dễ nhầm: I, L, O, 0, 1
const ORDERS_PER_HOUR = 5;

function newCode() {
  let c = "FV";
  for (let i = 0; i < 6; i++) c += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return c;
}

export function transferContent(code: string) {
  return `FUREVER ${code}`;
}

export function formatVnd(n: number) {
  return `${n.toLocaleString("vi-VN")} đ`;
}

export async function getPricing() {
  const s = await getSiteSettingsSafe();
  const n = (v: string) => (v && Number(v) > 0 ? Number(v) : null);
  return { full_box: n(s.price_full_box), tag_only: n(s.price_tag_only) };
}

export async function getPaymentAccount() {
  const s = await getSiteSettingsSafe();
  if (!s.bank_bin || !s.bank_account) return null;
  return {
    bin: s.bank_bin,
    bankName: BANKS[s.bank_bin] ?? s.bank_bin,
    accountNumber: s.bank_account,
    accountName: s.bank_account_name,
    contactEmail: s.contact_email,
  };
}

export async function createOrderRequest(input: OrderRequestInput, ipHash: string) {
  const recent = await db.orderRequest.count({
    where: { ipHash, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
  });
  if (recent >= ORDERS_PER_HOUR) throw new ConflictError("Bạn đã đặt nhiều đơn trong một giờ. Bạn nhắn cho bọn tớ để được hỗ trợ nhé.");
  const pricing = await getPricing();
  const amount = pricing[input.package];
  if (!amount) throw new ConflictError("Gói này chưa mở bán online, bạn nhắn cho bọn tớ nhé.");

  for (let attempt = 1; ; attempt++) {
    try {
      const order = await db.orderRequest.create({
        data: {
          code: newCode(),
          accessToken: generatePublicToken(),
          package: input.package,
          amount,
          customerName: input.customerName,
          phone: input.phone!,
          email: input.email,
          address: input.address,
          petName: input.petName,
          species: input.species,
          breed: input.breed,
          gender: input.gender,
          lifeStatus: input.lifeStatus,
          birthDate: input.birthDate,
          passedDate: input.passedDate,
          note: input.note,
          ipHash,
        },
      });
      await notifyOrderCreated(order.code, order.accessToken);
      return { code: order.code, accessToken: order.accessToken };
    } catch (e) {
      if (attempt < 3 && isUniqueViolation(e)) continue;
      throw e;
    }
  }
}

export function orderUrl(code: string, token: string) {
  return `${siteUrl()}/dat-hang/${code}?t=${token}`;
}

async function notifyOrderCreated(code: string, token: string) {
  const order = await db.orderRequest.findUniqueOrThrow({ where: { code } });
  const account = await getPaymentAccount();
  const link = orderUrl(code, token);
  if (order.email) {
    await sendMail({
      to: order.email,
      subject: `Furever đã nhận đơn ${code}`,
      text:
        `Chào ${order.customerName},\n\nBọn tớ đã nhận đơn ${PACKAGE_LABEL[order.package]} cho bé ${order.petName}.\n` +
        (order.amount ? `Số tiền: ${formatVnd(order.amount)}\n` : "") +
        (account
          ? `Chuyển khoản tới ${account.bankName} ${account.accountNumber} (${account.accountName}), nội dung: ${transferContent(code)}\n`
          : "") +
        `\nMã QR thanh toán và trạng thái đơn: ${link}\n\nSau khi nhận thanh toán, bọn tớ sẽ liên hệ để nhận ảnh và kỷ vật của bé.`,
    });
  }
  if (account?.contactEmail) {
    await sendMail({
      to: account.contactEmail,
      subject: `Đơn online mới ${code}: ${order.petName}`,
      text:
        `${order.customerName} (${order.phone}) vừa đặt ${PACKAGE_LABEL[order.package]}` +
        (order.amount ? ` - ${formatVnd(order.amount)}` : "") +
        `.\nNội dung chuyển khoản cần đối chiếu: ${transferContent(code)}\n\nXem đơn: ${siteUrl()}/admin/don-online`,
    });
  }
}

/** Đơn của khách, xem bằng mã đơn và token trong đường dẫn (không đoán được). */
export async function getOrderForCustomer(code: string, token: string) {
  if (!/^FV[A-Z0-9]{6}$/.test(code) || !/^[0-9A-Za-z]{22}$/.test(token)) return null;
  const order = await db.orderRequest.findUnique({ where: { code } });
  if (!order || order.accessToken !== token) return null;
  return order;
}

export async function paymentQrDataUrl(code: string, amount: number | null) {
  const account = await getPaymentAccount();
  if (!account) return null;
  const payload = buildVietQrPayload({
    bankBin: account.bin,
    accountNumber: account.accountNumber,
    amount,
    description: transferContent(code),
  });
  return QRCode.toDataURL(payload, { errorCorrectionLevel: "M", margin: 2, width: 560 });
}

// ---------- Admin ----------

export function listOrderRequests(status?: OrderRequestStatus) {
  return db.orderRequest.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { pet: { select: { id: true, cardNo: true } } },
  });
}

export function countPendingPayments() {
  return db.orderRequest.count({ where: { status: "pending_payment" } });
}

export async function markOrderPaid(id: string, adminId: string) {
  const order = await db.$transaction(async (tx) => {
    const o = await tx.orderRequest.findUnique({ where: { id } });
    if (!o) throw new NotFoundError("Đơn không tồn tại");
    if (o.status !== "pending_payment") throw new ConflictError("Đơn không ở trạng thái chờ thanh toán");
    const updated = await tx.orderRequest.update({ where: { id }, data: { status: "paid", paidAt: new Date() } });
    await audit(tx, adminId, "payment", "order_request", id, o.code);
    return updated;
  });
  if (order.email) {
    await sendMail({
      to: order.email,
      subject: `Furever đã nhận thanh toán đơn ${order.code}`,
      text:
        `Chào ${order.customerName},\n\nBọn tớ đã nhận được thanh toán cho đơn ${order.code}. Cảm ơn bạn!\n\n` +
        `Bước tiếp theo: gửi ảnh, video và câu chuyện của ${order.petName} cho bọn tớ qua Zalo hoặc Facebook. ` +
        `Khi hồ sơ của bé được tạo, bạn có thể đăng nhập bằng chính email này tại ${siteUrl()}/chu-nuoi/dang-nhap để tự thêm ảnh và kỷ niệm.\n\n` +
        `Trạng thái đơn: ${orderUrl(order.code, order.accessToken)}`,
    });
  }
}

export async function cancelOrder(id: string, adminId: string) {
  await db.$transaction(async (tx) => {
    const o = await tx.orderRequest.findUnique({ where: { id } });
    if (!o) throw new NotFoundError("Đơn không tồn tại");
    if (o.status === "converted") throw new ConflictError("Đơn đã tạo hồ sơ, không hủy được");
    await tx.orderRequest.update({ where: { id }, data: { status: "cancelled", cancelledAt: new Date() } });
    await audit(tx, adminId, "update", "order_request", id, "hủy đơn");
  });
}

/** Tạo hồ sơ thú cưng từ đơn online: dữ liệu khách nhập được chuyển sang hồ sơ, mã QR được phát hành. */
export async function convertOrderToPet(id: string, adminId: string): Promise<string> {
  const o = await db.orderRequest.findUnique({ where: { id } });
  if (!o) throw new NotFoundError("Đơn không tồn tại");
  if (o.status === "converted" && o.petId) return o.petId;
  if (o.status === "cancelled") throw new ConflictError("Đơn đã hủy");
  const memorial = o.lifeStatus === "memorial";
  const res = await createPet(
    {
      name: o.petName,
      species: o.species,
      breed: o.breed,
      gender: o.gender,
      birthDate: o.birthDate,
      coatColor: null,
      traits: null,
      note: null,
      tagline: null,
      lifeStatus: o.lifeStatus,
      passedDate: o.passedDate,
      ownerName: o.customerName,
      phone: o.phone,
      phone2: null,
      zaloMessenger: null,
      area: null,
      address: o.address,
      ownerEmail: o.email,
      showCallButton: !memorial,
      showPhone: !memorial,
      showPhone2: false,
      showArea: true,
      showAddress: false,
      showNote: true,
      showMedia: true,
      showMemories: true,
      showGuestbook: true,
      package: o.package,
      orderNote: `Đơn online ${o.code}${o.note ? `: ${o.note}` : ""}`,
      confirmDuplicate: true,
    },
    adminId,
  );
  if (!res.ok) throw new ConflictError("Không tạo được hồ sơ");
  await db.$transaction(async (tx) => {
    await tx.orderRequest.update({ where: { id }, data: { status: "converted", petId: res.id } });
    await audit(tx, adminId, "convert", "order_request", id, res.cardNo);
  });
  return res.id;
}
