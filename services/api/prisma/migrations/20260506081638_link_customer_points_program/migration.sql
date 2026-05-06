/*
  Warnings:

  - You are about to alter the column `totalLkr` on the `PendingPayment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - A unique constraint covering the columns `[customerId,programId]` on the table `CustomerPoints` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `programId` to the `CustomerPoints` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "CustomerPoints_customerId_key";

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "pointsAwarded" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "CustomerPoints" ADD COLUMN     "programId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PendingPayment" ALTER COLUMN "totalLkr" SET DATA TYPE INTEGER;

-- CreateIndex
CREATE INDEX "CustomerPoints_customerId_idx" ON "CustomerPoints"("customerId");

-- CreateIndex
CREATE INDEX "CustomerPoints_programId_idx" ON "CustomerPoints"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerPoints_customerId_programId_key" ON "CustomerPoints"("customerId", "programId");

-- AddForeignKey
ALTER TABLE "CustomerPoints" ADD CONSTRAINT "CustomerPoints_programId_fkey" FOREIGN KEY ("programId") REFERENCES "LoyaltyProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
