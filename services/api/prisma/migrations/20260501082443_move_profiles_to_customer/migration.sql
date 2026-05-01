/*
  Warnings:

  - You are about to drop the column `userId` on the `PendingPayment` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `UserFacePhotos` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `UserHairProfile` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[customerId]` on the table `UserFacePhotos` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[customerId]` on the table `UserHairProfile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `customerId` to the `PendingPayment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerId` to the `UserFacePhotos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerId` to the `UserHairProfile` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PendingPayment" DROP CONSTRAINT "PendingPayment_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserFacePhotos" DROP CONSTRAINT "UserFacePhotos_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserHairProfile" DROP CONSTRAINT "UserHairProfile_userId_fkey";

-- DropIndex
DROP INDEX "UserFacePhotos_userId_key";

-- DropIndex
DROP INDEX "UserHairProfile_userId_key";

-- AlterTable
ALTER TABLE "PendingPayment" DROP COLUMN "userId",
ADD COLUMN     "customerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "UserFacePhotos" DROP COLUMN "userId",
ADD COLUMN     "customerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "UserHairProfile" DROP COLUMN "userId",
ADD COLUMN     "customerId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "UserFacePhotos_customerId_key" ON "UserFacePhotos"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "UserHairProfile_customerId_key" ON "UserHairProfile"("customerId");

-- AddForeignKey
ALTER TABLE "UserHairProfile" ADD CONSTRAINT "UserHairProfile_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFacePhotos" ADD CONSTRAINT "UserFacePhotos_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingPayment" ADD CONSTRAINT "PendingPayment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
