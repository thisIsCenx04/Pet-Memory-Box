"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { ConflictError, NotFoundError } from "@/lib/errors";
import {
  confirmPhoto,
  confirmVideo,
  deletePhoto,
  deleteVideo,
  moveVideo,
  reorderPhotos,
  requestCoverUpload,
  requestPhotoUploads,
  requestVideoUpload,
  setCoverPhoto,
  updatePhotoCaption,
  updateVideoTitle,
} from "@/lib/services/media";
import { StorageNotConfiguredError, type UploadTarget } from "@/lib/storage";

// Server Action cho ảnh và video (UC-12, UC-13), gọi trực tiếp từ component phía trình duyệt.

export type MediaResult<T = undefined> = { ok: true; data: T } | { ok: false; message: string };

async function run<T>(fn: () => Promise<T>): Promise<MediaResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e instanceof ConflictError || e instanceof NotFoundError || e instanceof StorageNotConfiguredError) {
      return { ok: false, message: e.message };
    }
    if (e instanceof z.ZodError) return { ok: false, message: "Dữ liệu không hợp lệ" };
    console.error(e);
    return { ok: false, message: "Có lỗi xảy ra, vui lòng thử lại." };
  }
}

const uuid = z.uuid();
const petPath = (id: string) => `/admin/pets/${id}`;

const photoReq = z.object({
  mimeType: z.string(),
  sizeBytes: z.number().int().positive(),
  thumbMimeType: z.string(),
  thumbSizeBytes: z.number().int().positive(),
});

export async function requestPhotoUploadsAction(
  petId: string,
  items: z.input<typeof photoReq>[],
): Promise<MediaResult<{ photo: UploadTarget; thumb: UploadTarget }[]>> {
  await requireAdmin();
  return run(() => requestPhotoUploads(uuid.parse(petId), z.array(photoReq).parse(items)));
}

export async function confirmPhotoAction(
  petId: string,
  input: { key: string; thumbKey: string; width?: number; height?: number },
): Promise<MediaResult<{ id: string }>> {
  const admin = await requireAdmin();
  const res = await run(async () => {
    const parsed = z
      .object({ key: z.string(), thumbKey: z.string(), width: z.number().optional(), height: z.number().optional() })
      .parse(input);
    const asset = await confirmPhoto(uuid.parse(petId), parsed, admin.id);
    return { id: asset.id };
  });
  if (res.ok) revalidatePath(petPath(petId));
  return res;
}

export async function setCoverPhotoAction(petId: string, photoId: string): Promise<MediaResult> {
  await requireAdmin();
  const res = await run(async () => {
    await setCoverPhoto(uuid.parse(petId), uuid.parse(photoId));
    return undefined;
  });
  revalidatePath(petPath(petId));
  return res;
}

export async function updatePhotoCaptionAction(petId: string, photoId: string, caption: string): Promise<MediaResult> {
  await requireAdmin();
  return run(async () => {
    await updatePhotoCaption(uuid.parse(petId), uuid.parse(photoId), z.string().max(500).parse(caption));
    revalidatePath(petPath(petId));
    return undefined;
  });
}

export async function reorderPhotosAction(petId: string, ids: string[]): Promise<MediaResult> {
  await requireAdmin();
  return run(async () => {
    await reorderPhotos(uuid.parse(petId), z.array(uuid).max(100).parse(ids));
    revalidatePath(petPath(petId));
    return undefined;
  });
}

export async function deletePhotoAction(petId: string, photoId: string): Promise<MediaResult> {
  const admin = await requireAdmin();
  return run(async () => {
    await deletePhoto(uuid.parse(petId), uuid.parse(photoId), admin.id);
    revalidatePath(petPath(petId));
    return undefined;
  });
}

export async function requestCoverUploadAction(
  input: z.input<typeof photoReq>,
): Promise<MediaResult<{ photo: UploadTarget; thumb: UploadTarget }>> {
  await requireAdmin();
  return run(() => requestCoverUpload(photoReq.parse(input)));
}

const videoReq = z.object({
  mimeType: z.string(),
  sizeBytes: z.number().int().positive(),
  durationSec: z.number().positive(),
  posterMimeType: z.string(),
  posterSizeBytes: z.number().int().positive(),
});

export async function requestVideoUploadAction(
  petId: string,
  input: z.input<typeof videoReq>,
): Promise<MediaResult<{ video: UploadTarget; poster: UploadTarget }>> {
  await requireAdmin();
  return run(() => requestVideoUpload(uuid.parse(petId), videoReq.parse(input)));
}

export async function confirmVideoAction(
  petId: string,
  input: { key: string; posterKey: string; durationSec: number; title?: string },
): Promise<MediaResult<{ id: string }>> {
  const admin = await requireAdmin();
  const res = await run(async () => {
    const parsed = z
      .object({ key: z.string(), posterKey: z.string(), durationSec: z.number().positive(), title: z.string().optional() })
      .parse(input);
    const v = await confirmVideo(uuid.parse(petId), parsed, admin.id);
    return { id: v.id };
  });
  if (res.ok) revalidatePath(petPath(petId));
  return res;
}

export async function deleteVideoAction(petId: string, videoId: string): Promise<MediaResult> {
  const admin = await requireAdmin();
  return run(async () => {
    await deleteVideo(uuid.parse(petId), uuid.parse(videoId), admin.id);
    revalidatePath(petPath(petId));
    return undefined;
  });
}

export async function updateVideoTitleAction(petId: string, videoId: string, title: string): Promise<MediaResult> {
  await requireAdmin();
  return run(async () => {
    await updateVideoTitle(uuid.parse(petId), uuid.parse(videoId), z.string().max(300).parse(title));
    revalidatePath(petPath(petId));
    return undefined;
  });
}

export async function moveVideoAction(petId: string, videoId: string, direction: -1 | 1): Promise<MediaResult> {
  await requireAdmin();
  return run(async () => {
    await moveVideo(uuid.parse(petId), uuid.parse(videoId), direction === -1 ? -1 : 1);
    revalidatePath(petPath(petId));
    return undefined;
  });
}
