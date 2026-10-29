import "server-only";
import { db } from "../db";
import { ConflictError } from "../errors";
import type { MemoryInput } from "../validation";
import { parseVideoLink } from "../video-links";
import { audit, type Actor } from "./audit";

// Kỷ niệm và link video (UC-13), dùng chung cho admin và cổng chủ nuôi.

export async function addMemory(petId: string, input: MemoryInput, actor: Actor) {
  await db.$transaction(async (tx) => {
    const last = await tx.memory.aggregate({ where: { petId }, _max: { sortOrder: true } });
    await tx.memory.create({ data: { petId, ...input, sortOrder: (last._max.sortOrder ?? -1) + 1 } });
    await audit(tx, actor, "update", "pet", petId, "thêm kỷ niệm");
  });
}

export async function updateMemory(petId: string, memoryId: string, input: MemoryInput) {
  const res = await db.memory.updateMany({ where: { id: memoryId, petId }, data: input });
  if (res.count === 0) throw new ConflictError("Kỷ niệm không tồn tại");
}

export async function deleteMemory(petId: string, memoryId: string, actor: Actor) {
  await db.$transaction(async (tx) => {
    const res = await tx.memory.deleteMany({ where: { id: memoryId, petId } });
    if (res.count) await audit(tx, actor, "update", "pet", petId, "xóa kỷ niệm");
  });
}

export async function moveMemory(petId: string, memoryId: string, direction: -1 | 1) {
  const list = await db.memory.findMany({ where: { petId }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  const i = list.findIndex((m) => m.id === memoryId);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await db.$transaction(list.map((m, idx) => db.memory.update({ where: { id: m.id }, data: { sortOrder: idx } })));
}

export async function addVideoLink(petId: string, url: string, title: string | null) {
  const link = parseVideoLink(url);
  if (!link) throw new ConflictError("Chỉ nhận liên kết https từ youtube.com, youtu.be hoặc vimeo.com");
  const last = await db.video.aggregate({ where: { petId }, _max: { sortOrder: true } });
  await db.video.create({
    data: { petId, source: link.source, url: link.embedUrl, title, sortOrder: (last._max.sortOrder ?? -1) + 1 },
  });
}
