import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

// Tạo hoặc cập nhật bucket "pet-media" trên Supabase Storage. Chạy một lần: npm run storage:setup
// Bucket công khai để trang của bé đọc ảnh trực tiếp; đường dẫn tệp chứa UUID ngẫu nhiên nên không đoán được.

const BUCKET = "pet-media";
const MIME = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"];

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Cần SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY trong .env");
  const mb = Number(process.env.VIDEO_MAX_MB) || 100;
  const options = { public: true, fileSizeLimit: `${mb}MB`, allowedMimeTypes: MIME };

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data: existing } = await supabase.storage.getBucket(BUCKET);
  const { error } = existing
    ? await supabase.storage.updateBucket(BUCKET, options)
    : await supabase.storage.createBucket(BUCKET, options);

  if (error) {
    if (/maximum allowed|exceeds|size/i.test(error.message)) {
      throw new Error(
        `${error.message}\nGói Free của Supabase giới hạn mỗi tệp 50 MB. Đặt VIDEO_MAX_MB=50 trong .env (và trên Vercel) rồi chạy lại, hoặc nâng lên gói Pro.`,
      );
    }
    throw new Error(error.message);
  }
  console.log(`Bucket "${BUCKET}" sẵn sàng: công khai, tối đa ${mb} MB mỗi tệp, nhận ${MIME.join(", ")}.`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
