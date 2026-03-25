-- AlterTable
ALTER TABLE "AppointmentService" ADD COLUMN     "endTime" TEXT NOT NULL DEFAULT '9:15',
ADD COLUMN     "sequence" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "startTime" TEXT NOT NULL DEFAULT '9:00';

-- CreateIndex
CREATE INDEX "AppointmentService_stylistId_startTime_endTime_idx" ON "AppointmentService"("stylistId", "startTime", "endTime");
