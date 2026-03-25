/*
  Warnings:

  - You are about to drop the column `name` on the `Stylist` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Stylist` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Stylist` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Stylist` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StylistStatus" AS ENUM ('on_duty', 'on_leave');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'stylist';

-- AlterTable
ALTER TABLE "Stylist" DROP COLUMN "name",
DROP COLUMN "phone",
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "status" "StylistStatus" NOT NULL DEFAULT 'on_duty',
ADD COLUMN     "userId" TEXT NOT NULL,
ADD COLUMN     "yearsOfExperience" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address" TEXT,
ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "StylistSpecialty" (
    "stylistId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "StylistSpecialty_pkey" PRIMARY KEY ("stylistId","categoryId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Stylist_userId_key" ON "Stylist"("userId");

-- AddForeignKey
ALTER TABLE "Stylist" ADD CONSTRAINT "Stylist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StylistSpecialty" ADD CONSTRAINT "StylistSpecialty_stylistId_fkey" FOREIGN KEY ("stylistId") REFERENCES "Stylist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StylistSpecialty" ADD CONSTRAINT "StylistSpecialty_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
