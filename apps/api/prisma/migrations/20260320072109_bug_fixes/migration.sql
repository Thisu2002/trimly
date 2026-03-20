/*
  Warnings:

  - A unique constraint covering the columns `[appointmentId,sequence]` on the table `AppointmentService` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "AppointmentService" ALTER COLUMN "endTime" DROP DEFAULT,
ALTER COLUMN "sequence" DROP DEFAULT,
ALTER COLUMN "startTime" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentService_appointmentId_sequence_key" ON "AppointmentService"("appointmentId", "sequence");
