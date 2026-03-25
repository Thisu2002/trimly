/*
  Warnings:

  - You are about to drop the `StylistSpecialty` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_salonId_fkey";

-- DropForeignKey
ALTER TABLE "StylistSpecialty" DROP CONSTRAINT "StylistSpecialty_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "StylistSpecialty" DROP CONSTRAINT "StylistSpecialty_stylistId_fkey";

-- AlterTable
ALTER TABLE "Stylist" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "StylistSpecialty";

-- CreateTable
CREATE TABLE "StylistService" (
    "stylistId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "StylistService_pkey" PRIMARY KEY ("stylistId","serviceId")
);

-- CreateIndex
CREATE INDEX "StylistService_serviceId_idx" ON "StylistService"("serviceId");

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StylistService" ADD CONSTRAINT "StylistService_stylistId_fkey" FOREIGN KEY ("stylistId") REFERENCES "Stylist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StylistService" ADD CONSTRAINT "StylistService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
