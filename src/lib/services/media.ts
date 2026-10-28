import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "../db";
import { ConflictError, NotFoundError } from "../errors";
import {
  EXT,
  PHOTO_BATCH,
  PHOTO_MAX_BYTES,
  PHOTO_MAX_COUNT,
  PHOTO_MIME,
  POSTER_MAX_BYTES,
  THUMB_MAX_BYTES,
  VIDEO_MAX_COUNT,
  VIDEO_MAX_SECONDS,
  VIDEO_MIME,
  formatBytes,
  mimeFromKey,
} from "../media-rules";
import { storage, type UploadTarget } from "../storage";
import { audit } from "./audit";

// UC-12, UC-13: ảnh và video của hồ sơ. Tệp đi thẳng từ trình duyệt lên kho;
// máy chủ chỉ cấp URL có chữ ký rồi kiểm tra tệp đã nằm trên kho trước khi ghi bản ghi.

export function videoMaxBytes(): number {
  const mb = Number(process.env.VIDEO_MAX_MB);
  return (Number.isFinite(mb) && mb > 0 ? mb : 100) * 1024 * 1024;
}

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

function photoKeys(petId: string, mime: string, thumbMime: string) {
  const id = randomUUID();
  return {
    key: `pets/${petId}/photos/${id}.${EXT[mime]}`,
    thumbKey: `pets/${petId}/photos/${id}-thumb.${EXT[thumbMime]}`,
  };
}

function assertPhotoMime(mime: string): asserts mime is (typeof PHOTO_MIME)[number] {
  if (!(PHOTO_MIME as readonly string[]).includes(mime)) {
    throw new ConflictError("Chỉ nhận ảnh JPEG, PNG hoặc WebP");
  }
}

async function petExists(petId: string) {
  const pet = await db.pet.findUnique({ where: { id: petId }, select: { id: true } });
  if (!pet) throw new NotFoundError("Hồ sơ không tồn tại");
}

// ---------- Ảnh ----------

export type PhotoUploadRequest = { mimeType: string; sizeBytes: number; thumbMimeType: string; thumbSizeBytes: number };
export type PhotoUploadTargets = { photo: UploadTarget; thumb: UploadTarget };

export async function requestPhotoUploads(petId: string, items: PhotoUploadRequest[]): Promise<PhotoUploadTargets[]> {
  await petExists(petId);
  if (items.length === 0) return [];
  if (items.length > PHOTO_BATCH) throw new ConflictError(`Mỗi lần chọn tối đa ${PHOTO_BATCH} ảnh`);
  const count = await db.mediaAsset.count({ where: { petId } });
  if (count + items.length > PHOTO_MAX_COUNT) {
    throw new ConflictError(`Mỗi bé tối đa ${PHOTO_MAX_COUNT} ảnh. Hiện còn chỗ cho ${Math.max(0, PHOTO_MAX_COUNT - count)} ảnh.`);
  }
  const s = storage();
  return Promise.all(
    items.map(async (it) => {
      assertPhotoMime(it.mimeType);
      assertPhotoMime(it.thumbMimeType);
      if (it.sizeBytes <= 0 || it.sizeBytes > PHOTO_MAX_BYTES) throw new ConflictError("Ảnh vượt quá 5 MB");
      if (it.thumbSizeBytes <= 0 || it.thumbSizeBytes > THUMB_MAX_BYTES) throw new ConflictError("Ảnh nhỏ không hợp lệ");
      const { key, thumbKey } = photoKeys(petId, it.mimeType, it.thumbMimeType);
      const [photo, thumb] = await Promise.all([s.signedUpload(key, it.mimeType), s.signedUpload(thumbKey, it.thumbMimeType)]);
      return { photo, thumb };
    }),
  );
}

export type ConfirmPhoto = { key: string; thumbKey: string; width?: number; height?: number; caption?: string | null };

export async function confirmPhoto(petId: string, input: ConfirmPhoto, adminId: string) {
  const prefix = `pets/${petId}/photos/`;
  const keyRe = new RegExp(`^${prefix}(${UUID})\\.(jpg|png|webp)$`);
  const m = keyRe.exec(input.key);
  if (!m || !new RegExp(`^${prefix}${m[1]}-thumb\\.(jpg|png|webp)$`).test(input.thumbKey)) {
    throw new ConflictError("Khóa tệp không hợp lệ");
  }
  const s = storage();
  const [info, thumbInfo] = await Promise.all([s.info(input.key), s.info(input.thumbKey)]);
  if (!info || !thumbInfo) throw new ConflictError("Tệp chưa tải lên xong, vui lòng thử lại");
  if (info.size > PHOTO_MAX_BYTES) {
    await s.remove([input.key, input.thumbKey]);
    throw new ConflictError("Ảnh vượt quá 5 MB");
  }
  const mimeType = mimeFromKey(input.key)!;

  return db.$transaction(async (tx) => {
    const count = await tx.mediaAsset.count({ where: { petId } });
    if (count >= PHOTO_MAX_COUNT) throw new ConflictError(`Mỗi bé tối đa ${PHOTO_MAX_COUNT} ảnh`);
    const [last, cover] = await Promise.all([
      tx.mediaAsset.aggregate({ where: { petId }, _max: { sortOrder: true } }),
      tx.mediaAsset.findFirst({ where: { petId, isCover: true }, select: { id: true } }),
    ]);
    const asset = await tx.mediaAsset.create({
      data: {
        petId,
        storageKey: input.key,
        url: s.publicUrl(input.key),
        thumbKey: input.thumbKey,
        thumbUrl: s.publicUrl(input.thumbKey),
        width: input.width ? Math.round(input.width) : null,
        height: input.height ? Math.round(input.height) : null,
        mimeType,
        sizeBytes: info.size,
        caption: input.caption?.trim().slice(0, 200) || null,
        sortOrder: (last._max.sortOrder ?? -1) + 1,
        isCover: !cover, // ảnh đầu tiên tự làm ảnh đại diện
      },
    });
    await audit(tx, adminId, "update", "pet", petId, "thêm ảnh");
    return asset;
  });
}

export async function setCoverPhoto(petId: string, photoId: string) {
  await db.$transaction(async (tx) => {
    const photo = await tx.mediaAsset.findFirst({ where: { id: photoId, petId } });
    if (!photo) throw new NotFoundError("Ảnh không tồn tại");
    // Bỏ ảnh đại diện cũ trước để không vi phạm chỉ mục "một ảnh đại diện mỗi hồ sơ".
    await tx.mediaAsset.updateMany({ where: { petId, isCover: true }, data: { isCover: false } });
    await tx.mediaAsset.update({ where: { id: photoId }, data: { isCover: true } });
  });
}

export async function updatePhotoCaption(petId: string, photoId: string, caption: string) {
  const res = await db.mediaAsset.updateMany({
    where: { id: photoId, petId },
    data: { caption: caption.trim().slice(0, 200) || null },
  });
  if (res.count === 0) throw new NotFoundError("Ảnh không tồn tại");
}

/** Sắp xếp theo đúng thứ tự id truyền vào; id không thuộc hồ sơ bị bỏ qua. */
export async function reorderPhotos(petId: string, orderedIds: string[]) {
  const existing = await db.mediaAsset.findMany({ where: { petId }, select: { id: true } });
  const known = new Set(existing.map((p) => p.id));
  const ids = orderedIds.filter((id) => known.has(id));
  for (const p of existing) if (!ids.includes(p.id)) ids.push(p.id);
  await db.$transaction(ids.map((id, i) => db.mediaAsset.update({ where: { id }, data: { sortOrder: i } })));
}

export async function deletePhoto(petId: string, photoId: string, adminId: string) {
  const photo = await db.$transaction(async (tx) => {
    const p = await tx.mediaAsset.findFirst({ where: { id: photoId, petId } });
    if (!p) throw new NotFoundError("Ảnh không tồn tại");
    await tx.mediaAsset.delete({ where: { id: photoId } });
    if (p.isCover) {
      const next = await tx.mediaAsset.findFirst({ where: { petId }, orderBy: { sortOrder: "asc" } });
      if (next) await tx.mediaAsset.update({ where: { id: next.id }, data: { isCover: true } });
    }
    await audit(tx, adminId, "update", "pet", petId, "xóa ảnh");
    return p;
  });
  await removeQuietly([photo.storageKey, photo.thumbKey]);
}

// ---------- Ảnh đại diện khi tạo hồ sơ (UC-06, API-25) ----------

export async function requestCoverUpload(it: PhotoUploadRequest): Promise<PhotoUploadTargets> {
  assertPhotoMime(it.mimeType);
  assertPhotoMime(it.thumbMimeType);
  if (it.sizeBytes <= 0 || it.sizeBytes > PHOTO_MAX_BYTES) throw new ConflictError("Ảnh vượt quá 5 MB");
  if (it.thumbSizeBytes <= 0 || it.thumbSizeBytes > THUMB_MAX_BYTES) throw new ConflictError("Ảnh nhỏ không hợp lệ");
  const id = randomUUID();
  const s = storage();
  const [photo, thumb] = await Promise.all([
    s.signedUpload(`tmp/${id}.${EXT[it.mimeType]}`, it.mimeType),
    s.signedUpload(`tmp/${id}-thumb.${EXT[it.thumbMimeType]}`, it.thumbMimeType),
  ]);
  return { photo, thumb };
}

/** Chuyển ảnh đại diện từ vùng tạm sang thư mục của hồ sơ. Trả về false nếu không thành công. */
export async function attachCoverFromTmp(
  petId: string,
  tmp: { key: string; thumbKey: string; width?: number; height?: number },
  adminId: string,
): Promise<boolean> {
  const m = new RegExp(`^tmp/(${UUID})\\.(jpg|png|webp)$`).exec(tmp.key);
  if (!m || !new RegExp(`^tmp/${m[1]}-thumb\\.(jpg|png|webp)$`).test(tmp.thumbKey)) return false;
  try {
    const s = storage();
    const key = `pets/${petId}/photos/${m[1]}.${m[2]}`;
    const thumbKey = `pets/${petId}/photos/${tmp.thumbKey.slice(4)}`;
    await s.move(tmp.key, key);
    await s.move(tmp.thumbKey, thumbKey);
    await confirmPhoto(petId, { key, thumbKey, width: tmp.width, height: tmp.height }, adminId);
    return true;
  } catch (e) {
    console.error("attach_cover_failed", e);
    return false;
  }
}

// ---------- Video ----------

export type VideoUploadRequest = {
  mimeType: string;
  sizeBytes: number;
  durationSec: number;
  posterMimeType: string;
  posterSizeBytes: number;
};

export async function requestVideoUpload(petId: string, it: VideoUploadRequest) {
  await petExists(petId);
  if (!(VIDEO_MIME as readonly string[]).includes(it.mimeType)) throw new ConflictError("Chỉ nhận video MP4 hoặc WebM");
  if (it.sizeBytes <= 0 || it.sizeBytes > videoMaxBytes()) {
    throw new ConflictError(`Video vượt quá ${formatBytes(videoMaxBytes())}`);
  }
  if (!(it.durationSec > 0 && it.durationSec <= VIDEO_MAX_SECONDS + 0.5)) {
    throw new ConflictError(`Video dài tối đa ${VIDEO_MAX_SECONDS / 60} phút`);
  }
  assertPhotoMime(it.posterMimeType);
  if (it.posterSizeBytes <= 0 || it.posterSizeBytes > POSTER_MAX_BYTES) throw new ConflictError("Ảnh bìa không hợp lệ");
  const count = await db.video.count({ where: { petId, source: "upload" } });
  if (count >= VIDEO_MAX_COUNT) throw new ConflictError(`Mỗi bé tối đa ${VIDEO_MAX_COUNT} video tải lên`);

  const id = randomUUID();
  const s = storage();
  const [video, poster] = await Promise.all([
    s.signedUpload(`pets/${petId}/videos/${id}.${EXT[it.mimeType]}`, it.mimeType),
    s.signedUpload(`pets/${petId}/videos/${id}-poster.${EXT[it.posterMimeType]}`, it.posterMimeType),
  ]);
  return { video, poster };
}

export async function confirmVideo(
  petId: string,
  input: { key: string; posterKey: string; durationSec: number; title?: string | null },
  adminId: string,
) {
  const prefix = `pets/${petId}/videos/`;
  const m = new RegExp(`^${prefix}(${UUID})\\.(mp4|webm)$`).exec(input.key);
  if (!m || !new RegExp(`^${prefix}${m[1]}-poster\\.(jpg|png|webp)$`).test(input.posterKey)) {
    throw new ConflictError("Khóa tệp không hợp lệ");
  }
  const s = storage();
  const [info, posterInfo] = await Promise.all([s.info(input.key), s.info(input.posterKey)]);
  if (!info || !posterInfo) throw new ConflictError("Tệp chưa tải lên xong, vui lòng thử lại");
  if (info.size > videoMaxBytes()) {
    await s.remove([input.key, input.posterKey]);
    throw new ConflictError(`Video vượt quá ${formatBytes(videoMaxBytes())}`);
  }

  return db.$transaction(async (tx) => {
    const count = await tx.video.count({ where: { petId, source: "upload" } });
    if (count >= VIDEO_MAX_COUNT) throw new ConflictError(`Mỗi bé tối đa ${VIDEO_MAX_COUNT} video tải lên`);
    const last = await tx.video.aggregate({ where: { petId }, _max: { sortOrder: true } });
    const video = await tx.video.create({
      data: {
        petId,
        source: "upload",
        title: input.title?.trim().slice(0, 100) || null,
        url: s.publicUrl(input.key),
        storageKey: input.key,
        posterKey: input.posterKey,
        posterUrl: s.publicUrl(input.posterKey),
        mimeType: mimeFromKey(input.key),
        sizeBytes: BigInt(info.size),
        durationSec: Math.min(VIDEO_MAX_SECONDS, Math.round(input.durationSec)),
        sortOrder: (last._max.sortOrder ?? -1) + 1,
      },
    });
    await audit(tx, adminId, "update", "pet", petId, "thêm video");
    return video;
  });
}

export async function deleteVideo(petId: string, videoId: string, adminId: string) {
  const video = await db.$transaction(async (tx) => {
    const v = await tx.video.findFirst({ where: { id: videoId, petId } });
    if (!v) throw new NotFoundError("Video không tồn tại");
    await tx.video.delete({ where: { id: videoId } });
    await audit(tx, adminId, "update", "pet", petId, "xóa video");
    return v;
  });
  await removeQuietly([video.storageKey, video.posterKey]);
}

export async function updateVideoTitle(petId: string, videoId: string, title: string) {
  const res = await db.video.updateMany({
    where: { id: videoId, petId },
    data: { title: title.trim().slice(0, 100) || null },
  });
  if (res.count === 0) throw new NotFoundError("Video không tồn tại");
}

export async function moveVideo(petId: string, videoId: string, direction: -1 | 1) {
  const list = await db.video.findMany({ where: { petId }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  const i = list.findIndex((v) => v.id === videoId);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await db.$transaction(list.map((v, idx) => db.video.update({ where: { id: v.id }, data: { sortOrder: idx } })));
}

// ---------- Dọn dẹp ----------

/** Xóa tệp trên kho; lỗi chỉ ghi log vì bản ghi đã xóa xong. */
async function removeQuietly(keys: (string | null)[]) {
  const list = keys.filter((k): k is string => !!k);
  if (!list.length) return;
  try {
    await storage().remove(list);
  } catch (e) {
    console.error("storage_remove_failed", list, e);
  }
}

/** Xóa ảnh tạm của form tạo hồ sơ bị bỏ dở quá 24 giờ. */
export async function cleanupTmpUploads(): Promise<number> {
  const s = storage();
  const old = await s.listOlderThan("tmp", new Date(Date.now() - 24 * 60 * 60 * 1000));
  if (old.length) await s.remove(old);
  return old.length;
}
