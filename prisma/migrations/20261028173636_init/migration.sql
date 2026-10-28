-- Tìm kiếm theo tên (FR-12)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateEnum
CREATE TYPE "Species" AS ENUM ('dog', 'cat', 'other');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'unknown');

-- CreateEnum
CREATE TYPE "LifeStatus" AS ENUM ('alive', 'memorial');

-- CreateEnum
CREATE TYPE "PetStatus" AS ENUM ('active', 'archived');

-- CreateEnum
CREATE TYPE "QrStatus" AS ENUM ('active', 'locked', 'replaced');

-- CreateEnum
CREATE TYPE "VideoSource" AS ENUM ('upload', 'youtube', 'vimeo');

-- CreateEnum
CREATE TYPE "OrderPackage" AS ENUM ('full_box', 'tag_only');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('received', 'preparing', 'issued', 'delivered');

-- CreateEnum
CREATE TYPE "ScanResult" AS ENUM ('ok', 'not_found', 'locked', 'replaced', 'archived');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('create', 'update', 'lock', 'unlock', 'reissue', 'archive', 'restore', 'memorial', 'password_change');

-- CreateTable
CREATE TABLE "admin_users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_sessions" (
    "id" UUID NOT NULL,
    "admin_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owners" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "phone2" TEXT,
    "zalo_messenger" TEXT,
    "area" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pets" (
    "id" UUID NOT NULL,
    "card_no" TEXT NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "species" "Species" NOT NULL,
    "breed" TEXT,
    "gender" "Gender" NOT NULL DEFAULT 'unknown',
    "birth_date" DATE,
    "coat_color" TEXT,
    "traits" TEXT,
    "note" TEXT,
    "tagline" TEXT,
    "life_status" "LifeStatus" NOT NULL DEFAULT 'alive',
    "passed_date" DATE,
    "status" "PetStatus" NOT NULL DEFAULT 'active',
    "archived_at" TIMESTAMPTZ,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "pets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visibility_settings" (
    "pet_id" UUID NOT NULL,
    "show_call_button" BOOLEAN NOT NULL DEFAULT true,
    "show_phone" BOOLEAN NOT NULL DEFAULT true,
    "show_phone2" BOOLEAN NOT NULL DEFAULT false,
    "show_area" BOOLEAN NOT NULL DEFAULT true,
    "show_address" BOOLEAN NOT NULL DEFAULT false,
    "show_note" BOOLEAN NOT NULL DEFAULT true,
    "show_media" BOOLEAN NOT NULL DEFAULT true,
    "show_memories" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "visibility_settings_pkey" PRIMARY KEY ("pet_id")
);

-- CreateTable
CREATE TABLE "qr_tags" (
    "id" UUID NOT NULL,
    "pet_id" UUID NOT NULL,
    "token" CHAR(22) NOT NULL,
    "status" "QrStatus" NOT NULL DEFAULT 'active',
    "lock_reason" TEXT,
    "issued_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locked_at" TIMESTAMPTZ,
    "replaced_at" TIMESTAMPTZ,
    "replaced_by_id" UUID,

    CONSTRAINT "qr_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" UUID NOT NULL,
    "pet_id" UUID NOT NULL,
    "storage_key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "caption" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_cover" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "videos" (
    "id" UUID NOT NULL,
    "pet_id" UUID NOT NULL,
    "source" "VideoSource" NOT NULL,
    "title" TEXT,
    "url" TEXT NOT NULL,
    "storage_key" TEXT,
    "poster_key" TEXT,
    "mime_type" TEXT,
    "size_bytes" BIGINT,
    "duration_sec" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memories" (
    "id" UUID NOT NULL,
    "pet_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "memory_date" DATE,
    "content" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "pet_id" UUID NOT NULL,
    "package" "OrderPackage" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'received',
    "status_changed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_logs" (
    "id" BIGSERIAL NOT NULL,
    "qr_tag_id" UUID,
    "scanned_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "result" "ScanResult" NOT NULL,
    "ip_hash" TEXT NOT NULL,
    "user_agent" TEXT,

    CONSTRAINT "scan_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "admin_id" UUID NOT NULL,
    "action" "AuditAction" NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" UUID NOT NULL,
    "detail" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admin_sessions_token_hash_key" ON "admin_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "admin_sessions_admin_id_idx" ON "admin_sessions"("admin_id");

-- CreateIndex
CREATE INDEX "admin_sessions_expires_at_idx" ON "admin_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "owners_phone_idx" ON "owners"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "pets_card_no_key" ON "pets"("card_no");

-- CreateIndex
CREATE INDEX "pets_owner_id_idx" ON "pets"("owner_id");

-- CreateIndex
CREATE INDEX "pets_status_created_at_idx" ON "pets"("status", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "qr_tags_token_key" ON "qr_tags"("token");

-- CreateIndex
CREATE UNIQUE INDEX "qr_tags_replaced_by_id_key" ON "qr_tags"("replaced_by_id");

-- CreateIndex
CREATE INDEX "qr_tags_pet_id_idx" ON "qr_tags"("pet_id");

-- CreateIndex
CREATE INDEX "media_assets_pet_id_sort_order_idx" ON "media_assets"("pet_id", "sort_order");

-- CreateIndex
CREATE INDEX "videos_pet_id_sort_order_idx" ON "videos"("pet_id", "sort_order");

-- CreateIndex
CREATE INDEX "memories_pet_id_sort_order_idx" ON "memories"("pet_id", "sort_order");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_pet_id_idx" ON "orders"("pet_id");

-- CreateIndex
CREATE INDEX "scan_logs_qr_tag_id_scanned_at_idx" ON "scan_logs"("qr_tag_id", "scanned_at" DESC);

-- CreateIndex
CREATE INDEX "scan_logs_scanned_at_idx" ON "scan_logs"("scanned_at");

-- CreateIndex
CREATE INDEX "audit_logs_target_type_target_id_created_at_idx" ON "audit_logs"("target_type", "target_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visibility_settings" ADD CONSTRAINT "visibility_settings_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_tags" ADD CONSTRAINT "qr_tags_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_tags" ADD CONSTRAINT "qr_tags_replaced_by_id_fkey" FOREIGN KEY ("replaced_by_id") REFERENCES "qr_tags"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memories" ADD CONSTRAINT "memories_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_logs" ADD CONSTRAINT "scan_logs_qr_tag_id_fkey" FOREIGN KEY ("qr_tag_id") REFERENCES "qr_tags"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ===== Bổ sung thủ công (SRS v2, mục 14.3 và 14.4) =====

-- Mã thẻ PMB-xxxxxx lấy từ sequence, không dùng MAX + 1 (mục 14.4)
CREATE SEQUENCE "pet_card_no_seq" START 1 MINVALUE 1 NO CYCLE;

-- Mỗi hồ sơ chỉ có một mã đang dùng hoặc bị khóa (BR-01)
CREATE UNIQUE INDEX "qr_tags_one_current_per_pet" ON "qr_tags" ("pet_id") WHERE "status" <> 'replaced';

-- Tối đa một ảnh đại diện mỗi hồ sơ
CREATE UNIQUE INDEX "media_assets_one_cover_per_pet" ON "media_assets" ("pet_id") WHERE "is_cover";

-- Tìm kiếm theo tên bé và tên chủ (FR-12)
CREATE INDEX "pets_name_trgm" ON "pets" USING GIN ("name" gin_trgm_ops);
CREATE INDEX "owners_full_name_trgm" ON "owners" USING GIN ("full_name" gin_trgm_ops);

-- Giới hạn tệp (FR-18, FR-20)
ALTER TABLE "media_assets"
  ADD CONSTRAINT "media_assets_mime_check" CHECK ("mime_type" IN ('image/jpeg', 'image/png', 'image/webp')),
  ADD CONSTRAINT "media_assets_size_check" CHECK ("size_bytes" > 0 AND "size_bytes" <= 5242880);

ALTER TABLE "videos"
  ADD CONSTRAINT "videos_mime_check" CHECK ("mime_type" IS NULL OR "mime_type" IN ('video/mp4', 'video/webm')),
  ADD CONSTRAINT "videos_size_check" CHECK ("size_bytes" IS NULL OR ("size_bytes" > 0 AND "size_bytes" <= 104857600)),
  ADD CONSTRAINT "videos_duration_check" CHECK ("duration_sec" IS NULL OR ("duration_sec" >= 0 AND "duration_sec" <= 180)),
  ADD CONSTRAINT "videos_upload_has_key" CHECK ("source" <> 'upload' OR "storage_key" IS NOT NULL);

-- Token công khai đúng 22 ký tự base62 (NFR-06)
ALTER TABLE "qr_tags" ADD CONSTRAINT "qr_tags_token_format" CHECK ("token" ~ '^[0-9A-Za-z]{22}$');

-- Mã replaced không bao giờ quay lại active (mục 14.4)
CREATE FUNCTION "qr_tags_no_unreplace"() RETURNS trigger AS $$
BEGIN
  IF OLD."status" = 'replaced' AND NEW."status" <> 'replaced' THEN
    RAISE EXCEPTION 'qr_tag % is replaced and cannot change status', OLD."id";
  END IF;
  IF OLD."token" <> NEW."token" THEN
    RAISE EXCEPTION 'qr_tag token is immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "qr_tags_no_unreplace" BEFORE UPDATE ON "qr_tags"
  FOR EACH ROW EXECUTE FUNCTION "qr_tags_no_unreplace"();
