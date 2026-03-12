/*
  Warnings:

  - Made the column `categoryId` on table `Service` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_categoryId_fkey";

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Service" ALTER COLUMN "categoryId" SET NOT NULL;

-- CreateTable
CREATE TABLE "SalonBusinessHour" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalonBusinessHour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffWeeklyShift" (
    "id" TEXT NOT NULL,
    "stylistId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isOff" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffWeeklyShift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalonBusinessHour_salonId_dayOfWeek_idx" ON "SalonBusinessHour"("salonId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "SalonBusinessHour_salonId_dayOfWeek_key" ON "SalonBusinessHour"("salonId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "StaffWeeklyShift_stylistId_dayOfWeek_idx" ON "StaffWeeklyShift"("stylistId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "StaffWeeklyShift_stylistId_dayOfWeek_key" ON "StaffWeeklyShift"("stylistId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "Category_salonId_idx" ON "Category"("salonId");

-- CreateIndex
CREATE INDEX "Service_salonId_idx" ON "Service"("salonId");

-- CreateIndex
CREATE INDEX "Service_categoryId_idx" ON "Service"("categoryId");

-- AddForeignKey
ALTER TABLE "SalonBusinessHour" ADD CONSTRAINT "SalonBusinessHour_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffWeeklyShift" ADD CONSTRAINT "StaffWeeklyShift_stylistId_fkey" FOREIGN KEY ("stylistId") REFERENCES "Stylist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
