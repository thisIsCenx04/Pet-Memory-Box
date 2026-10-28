import { createReadStream } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { localPath, storageDriverName, verifyLocal } from "@/lib/storage";
import { mimeFromKey } from "@/lib/media-rules";

// Giả lập Supabase Storage khi STORAGE_DRIVER=local. Tắt hoàn toàn khi dùng Supabase.

const MAX_BYTES = 110 * 1024 * 1024;

type Ctx = { params: Promise<{ key: string[] }> };

function disabled() {
  return storageDriverName() !== "local";
}

export async function PUT(req: Request, { params }: Ctx) {
  if (disabled()) return new Response(null, { status: 404 });
  const key = (await params).key.join("/");
  const url = new URL(req.url);
  if (!verifyLocal(key, Number(url.searchParams.get("exp")), url.searchParams.get("sig") ?? "")) {
    return Response.json({ error: "invalid_signature" }, { status: 403 });
  }
  const p = localPath(key);
  if (!p) return Response.json({ error: "invalid_key" }, { status: 400 });
  try {
    await stat(p);
    return Response.json({ error: "exists" }, { status: 409 });
  } catch {}
  const body = Buffer.from(await req.arrayBuffer());
  if (body.length > MAX_BYTES) return Response.json({ error: "too_large" }, { status: 413 });
  await mkdir(path.dirname(p), { recursive: true });
  await writeFile(p, body);
  return Response.json({ Key: key });
}

export async function GET(req: Request, { params }: Ctx) {
  if (disabled()) return new Response(null, { status: 404 });
  const key = (await params).key.join("/");
  const p = localPath(key);
  if (!p) return new Response(null, { status: 404 });
  let size: number;
  try {
    size = (await stat(p)).size;
  } catch {
    return new Response(null, { status: 404 });
  }
  const type = mimeFromKey(key) ?? "application/octet-stream";
  const range = /bytes=(\d*)-(\d*)/.exec(req.headers.get("range") ?? "");
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    const stream = Readable.toWeb(createReadStream(p, { start, end })) as ReadableStream;
    return new Response(stream, {
      status: 206,
      headers: {
        "content-type": type,
        "content-length": String(end - start + 1),
        "content-range": `bytes ${start}-${end}/${size}`,
        "accept-ranges": "bytes",
      },
    });
  }
  const stream = Readable.toWeb(createReadStream(p)) as ReadableStream;
  return new Response(stream, {
    headers: { "content-type": type, "content-length": String(size), "accept-ranges": "bytes" },
  });
}
