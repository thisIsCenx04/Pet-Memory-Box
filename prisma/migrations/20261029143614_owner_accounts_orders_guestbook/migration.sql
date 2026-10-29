-- CreateEnum
CREATE TYPE "GuestbookStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "OrderRequestStatus" AS ENUM ('pending_payment', 'paid', 'converted', 'cancelled');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'payment';
ALTER TYPE "AuditAction" ADD VALUE 'convert';
ALTER TYPE "AuditAction" ADD VALUE 'moderate';

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_admin_id_fkey";

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "actor_email" TEXT,
ALTER COLUMN "admin_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "owners" ADD COLUMN     "email" TEXT,
ADD COLUMN     "notify_scan" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "pets" ADD COLUMN     "last_scan_notified_at" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "visibility_settings" ADD COLUMN     "show_guestbook" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "owner_otps" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "consumed_at" TIMESTAMPTZ,
    "ip_hash" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "owner_otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owner_sessions" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "owner_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "found_reports" (
    "id" UUID NOT NULL,
    "pet_id" UUID NOT NULL,
    "qr_tag_id" UUID,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "accuracy_m" INTEGER,
    "message" TEXT,
    "finder_contact" TEXT,
    "ip_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "found_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guestbook_entries" (
    "id" UUID NOT NULL,
    "pet_id" UUID NOT NULL,
    "author_name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "GuestbookStatus" NOT NULL DEFAULT 'pending',
    "ip_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moderated_at" TIMESTAMPTZ,

    CONSTRAINT "guestbook_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_requests" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "package" "OrderPackage" NOT NULL,
    "amount" INTEGER,
    "status" "OrderRequestStatus" NOT NULL DEFAULT 'pending_payment',
    "customer_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT NOT NULL,
    "pet_name" TEXT NOT NULL,
    "species" "Species" NOT NULL,
    "breed" TEXT,
    "gender" "Gender" NOT NULL DEFAULT 'unknown',
    "life_status" "LifeStatus" NOT NULL DEFAULT 'alive',
    "birth_date" DATE,
    "passed_date" DATE,
    "note" TEXT,
    "ip_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMPTZ,
    "cancelled_at" TIMESTAMPTZ,
    "pet_id" UUID,

    CONSTRAINT "order_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "owner_otps_email_created_at_idx" ON "owner_otps"("email", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "owner_sessions_token_hash_key" ON "owner_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "owner_sessions_email_idx" ON "owner_sessions"("email");

-- CreateIndex
CREATE INDEX "owner_sessions_expires_at_idx" ON "owner_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "found_reports_pet_id_created_at_idx" ON "found_reports"("pet_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "found_reports_ip_hash_created_at_idx" ON "found_reports"("ip_hash", "created_at");

-- CreateIndex
CREATE INDEX "guestbook_entries_pet_id_status_created_at_idx" ON "guestbook_entries"("pet_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "guestbook_entries_ip_hash_created_at_idx" ON "guestbook_entries"("ip_hash", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "order_requests_code_key" ON "order_requests"("code");

-- CreateIndex
CREATE UNIQUE INDEX "order_requests_access_token_key" ON "order_requests"("access_token");

-- CreateIndex
CREATE INDEX "order_requests_status_created_at_idx" ON "order_requests"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "order_requests_ip_hash_created_at_idx" ON "order_requests"("ip_hash", "created_at");

-- CreateIndex
CREATE INDEX "owners_email_idx" ON "owners"("email");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "found_reports" ADD CONSTRAINT "found_reports_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guestbook_entries" ADD CONSTRAINT "guestbook_entries_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_requests" ADD CONSTRAINT "order_requests_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Thủ công
CREATE INDEX "owners_email_lower" ON "owners" (lower("email"));
ALTER TABLE "order_requests" ADD CONSTRAINT "order_requests_amount_check" CHECK ("amount" IS NULL OR "amount" >= 0);
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_check" CHECK ("admin_id" IS NOT NULL OR "actor_email" IS NOT NULL);
