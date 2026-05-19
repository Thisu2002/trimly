-- AlterTable
ALTER TABLE "Salon" ADD COLUMN     "photos" TEXT[] DEFAULT ARRAY[]::TEXT[];
