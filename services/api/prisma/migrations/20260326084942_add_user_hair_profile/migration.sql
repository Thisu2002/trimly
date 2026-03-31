-- CreateTable
CREATE TABLE "UserHairProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "faceShape" TEXT,
    "hairType" TEXT,
    "hairLength" TEXT,
    "styleGoal" TEXT,
    "previousServices" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "detectionMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserHairProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserHairProfile_userId_key" ON "UserHairProfile"("userId");

-- AddForeignKey
ALTER TABLE "UserHairProfile" ADD CONSTRAINT "UserHairProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
