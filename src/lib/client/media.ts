// Xử lý tệp phía trình duyệt trước khi tải lên: nén ảnh, đọc thông tin video, chụp ảnh bìa,
// tải lên có tiến độ. Không dùng ở máy chủ.

export type ProcessedImage = { blob: Blob; width: number; height: number; mimeType: "image/webp" | "image/jpeg" };

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function encode(canvas: HTMLCanvasElement, quality: number): Promise<ProcessedImage> {
  // Safari cũ không mã hóa được WebP và trả về PNG; khi đó dùng JPEG.
  const webp = await canvasToBlob(canvas, "image/webp", quality);
  if (webp && webp.type === "image/webp") {
    return { blob: webp, width: canvas.width, height: canvas.height, mimeType: "image/webp" };
  }
  const jpeg = await canvasToBlob(canvas, "image/jpeg", quality);
  if (!jpeg) throw new Error("Trình duyệt không xử lý được ảnh này");
  return { blob: jpeg, width: canvas.width, height: canvas.height, mimeType: "image/jpeg" };
}

function drawScaled(source: CanvasImageSource, w: number, h: number, maxDim: number): HTMLCanvasElement {
  const scale = Math.min(1, maxDim / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * Nén ảnh về cạnh dài tối đa `maxDim`, xoay đúng chiều theo EXIF.
 * Mã hóa lại cũng xóa toàn bộ EXIF (kể cả tọa độ GPS nơi chụp).
 */
export async function processImage(file: Blob, maxDim: number, quality = 0.85): Promise<ProcessedImage> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("Không đọc được ảnh, có thể tệp bị hỏng");
  }
  try {
    return await encode(drawScaled(bitmap, bitmap.width, bitmap.height, maxDim), quality);
  } finally {
    bitmap.close();
  }
}

export type VideoProbe = { durationSec: number; width: number; height: number; poster: ProcessedImage };

/** Tìm dấu hiệu codec HEVC trong 2 MB đầu và cuối tệp MP4 (hộp stsd chứa hvc1/hev1). */
async function looksLikeHevc(file: File): Promise<boolean> {
  if (file.type !== "video/mp4") return false;
  const chunk = 2 * 1024 * 1024;
  const parts = [file.slice(0, chunk), file.size > chunk ? file.slice(Math.max(0, file.size - chunk)) : null];
  for (const part of parts) {
    if (!part) continue;
    const bytes = new Uint8Array(await part.arrayBuffer());
    for (let i = 0; i < bytes.length - 3; i++) {
      // 'h' 'v' 'c' '1' hoặc 'h' 'e' 'v' '1'
      if (bytes[i] === 0x68 && bytes[i + 3] === 0x31) {
        const a = bytes[i + 1];
        const b = bytes[i + 2];
        if ((a === 0x76 && b === 0x63) || (a === 0x65 && b === 0x76)) return true;
      }
    }
  }
  return false;
}

/** Đọc thời lượng, kiểm tra trình duyệt phát được và chụp một khung hình làm ảnh bìa. */
export async function probeVideo(file: File, posterMaxDim = 1280): Promise<VideoProbe> {
  if (await looksLikeHevc(file)) {
    throw new Error(
      "Video dùng định dạng HEVC (thường quay từ iPhone), nhiều điện thoại Android không xem được. Hãy xuất lại dạng MP4 (H.264) rồi tải lên.",
    );
  }
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  video.src = url;
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Không đọc được video trong thời gian cho phép")), 20000);
      video.onloadedmetadata = () => {
        clearTimeout(timer);
        resolve();
      };
      video.onerror = () => {
        clearTimeout(timer);
        reject(new Error("Trình duyệt không phát được video này. Hãy xuất lại dạng MP4 (H.264)."));
      };
    });
    const durationSec = video.duration;
    if (!Number.isFinite(durationSec) || durationSec <= 0) throw new Error("Không đọc được thời lượng video");
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Không giải mã được khung hình của video")), 20000);
      video.onseeked = () => {
        clearTimeout(timer);
        resolve();
      };
      video.currentTime = Math.min(1, durationSec / 3);
    });
    if (!video.videoWidth || !video.videoHeight) {
      throw new Error("Trình duyệt không hiển thị được hình của video này. Hãy xuất lại dạng MP4 (H.264).");
    }
    const poster = await encode(drawScaled(video, video.videoWidth, video.videoHeight, posterMaxDim), 0.8);
    return { durationSec, width: video.videoWidth, height: video.videoHeight, poster };
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}

export type Target = { uploadUrl: string; method: "PUT"; headers: Record<string, string> };

/** Tải thẳng lên kho bằng URL có chữ ký, báo tiến độ 0..1. */
export function uploadWithProgress(target: Target, body: Blob, onProgress?: (p: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(target.method, target.uploadUrl);
    for (const [k, v] of Object.entries(target.headers)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1);
        resolve();
      } else if (xhr.status === 413) {
        reject(new Error("Tệp vượt giới hạn dung lượng của kho lưu trữ"));
      } else {
        reject(new Error(`Tải lên thất bại (mã ${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("Mất kết nối khi tải lên"));
    xhr.send(body);
  });
}

export function formatDuration(sec: number): string {
  const s = Math.round(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
