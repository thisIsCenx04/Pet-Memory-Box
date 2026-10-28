-- AlterTable
ALTER TABLE "media_assets" ADD COLUMN     "height" INTEGER,
ADD COLUMN     "thumb_key" TEXT,
ADD COLUMN     "thumb_url" TEXT,
ADD COLUMN     "width" INTEGER;

-- AlterTable
ALTER TABLE "videos" ADD COLUMN     "poster_url" TEXT;
