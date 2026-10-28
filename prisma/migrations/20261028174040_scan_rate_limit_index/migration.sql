-- DropIndex
DROP INDEX "owners_full_name_trgm";

-- DropIndex
DROP INDEX "pets_name_trgm";

-- CreateIndex
CREATE INDEX "scan_logs_ip_hash_scanned_at_idx" ON "scan_logs"("ip_hash", "scanned_at");
