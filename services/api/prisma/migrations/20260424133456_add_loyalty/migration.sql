-- CreateTable
CREATE TABLE "LoyaltyProgram" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyRule" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "iconKey" TEXT NOT NULL,
    "colorKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyTier" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "threshold" INTEGER NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL,
    "benefits" TEXT[],
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyReward" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pointsCost" INTEGER NOT NULL,
    "tierRequired" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerPoints" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "tierId" TEXT,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "lifetimePoints" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerPoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardRedemption" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "pointsSpent" INTEGER NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyProgram_salonId_key" ON "LoyaltyProgram"("salonId");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyRule_programId_action_key" ON "LoyaltyRule"("programId", "action");

-- CreateIndex
CREATE INDEX "LoyaltyTier_programId_idx" ON "LoyaltyTier"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyTier_programId_name_key" ON "LoyaltyTier"("programId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyTier_programId_sortOrder_key" ON "LoyaltyTier"("programId", "sortOrder");

-- CreateIndex
CREATE INDEX "LoyaltyReward_programId_idx" ON "LoyaltyReward"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerPoints_customerId_key" ON "CustomerPoints"("customerId");

-- CreateIndex
CREATE INDEX "RewardRedemption_customerId_idx" ON "RewardRedemption"("customerId");

-- CreateIndex
CREATE INDEX "RewardRedemption_rewardId_idx" ON "RewardRedemption"("rewardId");

-- AddForeignKey
ALTER TABLE "LoyaltyProgram" ADD CONSTRAINT "LoyaltyProgram_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyRule" ADD CONSTRAINT "LoyaltyRule_programId_fkey" FOREIGN KEY ("programId") REFERENCES "LoyaltyProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyTier" ADD CONSTRAINT "LoyaltyTier_programId_fkey" FOREIGN KEY ("programId") REFERENCES "LoyaltyProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyReward" ADD CONSTRAINT "LoyaltyReward_programId_fkey" FOREIGN KEY ("programId") REFERENCES "LoyaltyProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPoints" ADD CONSTRAINT "CustomerPoints_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPoints" ADD CONSTRAINT "CustomerPoints_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "LoyaltyTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "LoyaltyReward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
