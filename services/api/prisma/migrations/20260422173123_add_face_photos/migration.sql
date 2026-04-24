-- CreateTable
CREATE TABLE "UserFacePhotos" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "frontPhoto" TEXT NOT NULL,
    "leftPhoto" TEXT NOT NULL,
    "rightPhoto" TEXT NOT NULL,
    "generatedPhotos" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserFacePhotos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserFacePhotos_userId_key" ON "UserFacePhotos"("userId");

-- AddForeignKey
ALTER TABLE "UserFacePhotos" ADD CONSTRAINT "UserFacePhotos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
