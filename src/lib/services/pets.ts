import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { PetStatus, QrStatus } from "@/generated/prisma/enums";
import { db } from "../db";
import { ConflictError, NotFoundError, isUniqueViolation } from "../errors";
import { normalizeVnPhone } from "../phone";
import { formatCardNo, generatePublicToken } from "../tokens";
import type { CreatePetInput, UpdatePetInput, Visibility } from "../validation";
import { audit, type Actor } from "./audit";

export const PAGE_SIZE = 20; // FR-12

export type CreatePetResult =
  | { ok: true; id: string; cardNo: string; token: string }
  | { ok: false; duplicateOf: { id: string; cardNo: string } };

/** UC-06 + UC-14: lưu hồ sơ, cấu hình hiển thị, đơn hàng và sinh mã trong một giao dịch. */
export async function createPet(input: CreatePetInput, adminId: string): Promise<CreatePetResult> {
  if (!input.confirmDuplicate) {
    const dup = await db.pet.findFirst({
      where: {
        status: "active",
        name: { equals: input.name, mode: "insensitive" },
        owner: { phone: input.phone! },
      },
      select: { id: true, cardNo: true },
    });
    if (dup) return { ok: false, duplicateOf: dup };
  }

  // Token trùng có xác suất không đáng kể; vẫn sinh lại tối đa 3 lần (UC-14 E1).
  for (let attempt = 1; ; attempt++) {
    try {
      return await db.$transaction(async (tx) => {
        const [{ nextval }] = await tx.$queryRaw<{ nextval: bigint }[]>`SELECT nextval('pet_card_no_seq')`;
        const cardNo = formatCardNo(nextval);
        const token = generatePublicToken();

        const owner = await tx.owner.create({
          data: {
            fullName: input.ownerName,
            phone: input.phone!,
            phone2: input.phone2,
            zaloMessenger: input.zaloMessenger,
            area: input.area,
            address: input.address,
            email: input.ownerEmail,
          },
        });

        const pet = await tx.pet.create({
          data: {
            cardNo,
            ownerId: owner.id,
            name: input.name,
            species: input.species,
            breed: input.breed,
            gender: input.gender,
            birthDate: input.birthDate,
            coatColor: input.coatColor,
            traits: input.traits,
            note: input.note,
            tagline: input.tagline,
            lifeStatus: input.lifeStatus,
            passedDate: input.passedDate,
            visibility: { create: pickVisibility(input) },
            qrTags: { create: { token } },
            orders: { create: { ownerId: owner.id, package: input.package, note: input.orderNote } },
          },
        });

        await audit(tx, adminId, "create", "pet", pet.id, cardNo);
        return { ok: true as const, id: pet.id, cardNo, token };
      });
    } catch (e) {
      if (attempt < 3 && isUniqueViolation(e, "token")) continue;
      throw e;
    }
  }
}

function pickVisibility(v: Visibility): Visibility {
  return {
    showCallButton: v.showCallButton,
    showPhone: v.showPhone,
    showPhone2: v.showPhone2,
    showArea: v.showArea,
    showAddress: v.showAddress,
    showNote: v.showNote,
    showMedia: v.showMedia,
    showMemories: v.showMemories,
    showGuestbook: v.showGuestbook,
  };
}

export type PetListFilter = {
  q?: string;
  status?: PetStatus;
  qrStatus?: QrStatus;
  page?: number;
};

/** UC-07: danh sách hồ sơ, tìm theo mã thẻ, tên bé, tên chủ, số điện thoại. */
export async function listPets(filter: PetListFilter) {
  const page = Math.max(1, filter.page ?? 1);
  const q = filter.q?.trim();
  const and: Prisma.PetWhereInput[] = [];

  if (q) {
    const phone = normalizeVnPhone(q) ?? (/^\d{3,}$/.test(q) ? q : null);
    and.push({
      OR: [
        { cardNo: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
        { owner: { fullName: { contains: q, mode: "insensitive" } } },
        ...(phone ? [{ owner: { phone: { contains: phone } } }] : []),
      ],
    });
  }
  if (filter.status) and.push({ status: filter.status });
  if (filter.qrStatus) and.push({ qrTags: { some: { status: filter.qrStatus } } });

  const where: Prisma.PetWhereInput = { AND: and };
  const [items, total] = await Promise.all([
    db.pet.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        cardNo: true,
        name: true,
        status: true,
        lifeStatus: true,
        createdAt: true,
        owner: { select: { fullName: true, phone: true } },
        qrTags: { where: { status: { not: "replaced" } }, select: { status: true }, take: 1 },
        orders: { orderBy: { createdAt: "desc" }, select: { status: true }, take: 1 },
      },
    }),
    db.pet.count({ where }),
  ]);
  return { items, total, page, pageSize: PAGE_SIZE };
}

/** UC-08: chi tiết hồ sơ kèm mã, nội dung, đơn hàng và lịch sử thao tác. */
export async function getPetDetail(id: string) {
  const pet = await db.pet.findUnique({
    where: { id },
    include: {
      owner: true,
      visibility: true,
      qrTags: { orderBy: { issuedAt: "desc" } },
      media: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      videos: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      memories: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      orders: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!pet) return null;

  const targetIds = [pet.id, ...pet.qrTags.map((t) => t.id), ...pet.orders.map((o) => o.id)];
  const history = await db.auditLog.findMany({
    where: { targetId: { in: targetIds } },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { admin: { select: { email: true } } },
  });
  return { ...pet, history };
}

async function petOrThrow(tx: Prisma.TransactionClient, id: string) {
  const pet = await tx.pet.findUnique({ where: { id } });
  if (!pet) throw new NotFoundError("Hồ sơ không tồn tại");
  return pet;
}

/** UC-09: sửa thông tin; từ chối nếu version đã đổi (khóa lạc quan, FR-14). */
export async function updatePet(id: string, input: UpdatePetInput, adminId: string) {
  await db.$transaction(async (tx) => {
    const pet = await petOrThrow(tx, id);
    const updated = await tx.pet.updateMany({
      where: { id, version: input.version },
      data: {
        name: input.name,
        species: input.species,
        breed: input.breed,
        gender: input.gender,
        birthDate: input.birthDate,
        coatColor: input.coatColor,
        traits: input.traits,
        note: input.note,
        tagline: input.tagline,
        lifeStatus: input.lifeStatus,
        passedDate: input.passedDate,
        version: { increment: 1 },
      },
    });
    if (updated.count === 0) {
      throw new ConflictError("Hồ sơ vừa được sửa ở nơi khác. Tải lại trang để xem bản mới nhất.");
    }
    await tx.owner.update({
      where: { id: pet.ownerId },
      data: {
        fullName: input.ownerName,
        phone: input.phone!,
        phone2: input.phone2,
        zaloMessenger: input.zaloMessenger,
        area: input.area,
        address: input.address,
        email: input.ownerEmail,
      },
    });
    await audit(tx, adminId, "update", "pet", id);
  });
}

/** UC-10 */
export async function setVisibility(id: string, v: Visibility, actor: Actor) {
  await db.$transaction(async (tx) => {
    await petOrThrow(tx, id);
    const data = pickVisibility(v);
    await tx.visibilitySettings.upsert({ where: { petId: id }, update: data, create: { petId: id, ...data } });
    await audit(tx, actor, "update", "pet", id, "visibility");
  });
}

/** UC-11 */
export async function setArchived(id: string, archived: boolean, adminId: string) {
  await db.$transaction(async (tx) => {
    const pet = await petOrThrow(tx, id);
    if ((pet.status === "archived") === archived) return;
    await tx.pet.update({
      where: { id },
      data: archived ? { status: "archived", archivedAt: new Date() } : { status: "active", archivedAt: null },
    });
    await audit(tx, adminId, archived ? "archive" : "restore", "pet", id);
  });
}

/** UC-24: chuyển chế độ tưởng niệm; khi chuyển sang memorial thì tắt nút gọi và số điện thoại (BR-09). */
export async function setLifeStatus(
  id: string,
  input: { lifeStatus: "alive" | "memorial"; passedDate: Date | null },
  adminId: string,
) {
  await db.$transaction(async (tx) => {
    const pet = await petOrThrow(tx, id);
    if (input.lifeStatus === "memorial" && input.passedDate && pet.birthDate && input.passedDate < pet.birthDate) {
      throw new ConflictError("Ngày mất không được trước ngày sinh");
    }
    await tx.pet.update({
      where: { id },
      data: {
        lifeStatus: input.lifeStatus,
        passedDate: input.lifeStatus === "memorial" ? input.passedDate : null,
        version: { increment: 1 },
      },
    });
    if (input.lifeStatus === "memorial" && pet.lifeStatus !== "memorial") {
      await tx.visibilitySettings.update({
        where: { petId: id },
        data: { showCallButton: false, showPhone: false, showPhone2: false },
      });
    }
    await audit(tx, adminId, "memorial", "pet", id, input.lifeStatus);
  });
}
