import "server-only";
import { db } from "../db";

const since7d = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

/** Các bé của chủ nuôi (theo email), kèm số liệu nhanh cho trang tổng quan. */
export async function listOwnerPets(email: string) {
  const pets = await db.pet.findMany({
    where: { owner: { email: { equals: email, mode: "insensitive" } } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      cardNo: true,
      name: true,
      status: true,
      lifeStatus: true,
      media: { where: { isCover: true }, select: { thumbUrl: true, url: true }, take: 1 },
      qrTags: { where: { status: { not: "replaced" } }, select: { status: true }, take: 1 },
      _count: {
        select: {
          foundReports: { where: { createdAt: { gte: since7d() } } },
          guestbook: { where: { status: "pending" } },
        },
      },
    },
  });
  const scans = await db.scanLog.groupBy({
    by: ["qrTagId"],
    where: { result: "ok", scannedAt: { gte: since7d() }, qrTag: { petId: { in: pets.map((p) => p.id) } } },
    _count: { _all: true },
  });
  const tagPet = await db.qrTag.findMany({
    where: { id: { in: scans.map((s) => s.qrTagId!).filter(Boolean) } },
    select: { id: true, petId: true },
  });
  const scansByPet = new Map<string, number>();
  for (const s of scans) {
    const petId = tagPet.find((t) => t.id === s.qrTagId)?.petId;
    if (petId) scansByPet.set(petId, (scansByPet.get(petId) ?? 0) + s._count._all);
  }
  return pets.map((p) => ({ ...p, scans7d: scansByPet.get(p.id) ?? 0 }));
}

export async function getOwnerPet(petId: string) {
  return db.pet.findUniqueOrThrow({
    where: { id: petId },
    include: {
      owner: { select: { fullName: true, email: true, notifyScan: true } },
      visibility: true,
      qrTags: { where: { status: { not: "replaced" } }, take: 1 },
      media: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      videos: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      memories: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
    },
  });
}
