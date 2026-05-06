// D:\trimly\services\api\src\lib\awardPoints.ts

import { prisma } from "./prisma";

interface AwardPointsParams {
  customerId: string;
  salonId: string;
  action: "service_completed" | "review_submitted" | "monthly_visit" | "spending_per_100";
  spendLkr?: number;
}

interface AwardPointsResult {
  pointsAdded: number;
  newTotal: number;
  newLifetime: number;
  tierChanged: boolean;
  newTierName: string | null;
}

export async function awardPoints({
  customerId,
  salonId,
  action,
  spendLkr,
}: AwardPointsParams): Promise<AwardPointsResult | null> {
  const program = await prisma.loyaltyProgram.findUnique({
    where: { salonId },
    include: {
      rules: true,
      tiers: { orderBy: { sortOrder: "desc" } },
    },
  });

  if (!program) return null;

  const rule = program.rules.find((r) => r.action === action);
  if (!rule) return null;

  let pointsToAdd = rule.points;
  if (action === "spending_per_100" && spendLkr) {
    pointsToAdd = Math.floor(spendLkr / 100) * rule.points;
  }
  if (pointsToAdd <= 0) return null;

  const result = await prisma.$transaction(async (tx) => {
    // Per-salon upsert using the composite unique key
    const cp = await tx.customerPoints.upsert({
      where: { customerId_programId: { customerId, programId: program.id } },
      create: {
        customerId,
        programId: program.id,
        totalPoints: pointsToAdd,
        lifetimePoints: pointsToAdd,
      },
      update: {
        totalPoints: { increment: pointsToAdd },
        lifetimePoints: { increment: pointsToAdd },
      },
    });

    const newLifetime = cp.lifetimePoints + pointsToAdd;
    const newTier =
      program.tiers.find((t) => newLifetime >= t.threshold) ??
      program.tiers[program.tiers.length - 1];

    const tierChanged = cp.tierId !== newTier.id;

    await tx.customerPoints.update({
      where: { customerId_programId: { customerId, programId: program.id } },
      data: { tierId: newTier.id },
    });

    return {
      pointsAdded: pointsToAdd,
      newTotal: cp.totalPoints + pointsToAdd,
      newLifetime,
      tierChanged,
      newTierName: tierChanged ? newTier.name : null,
    };
  });

  return result;
}

/**
 * Atomically checks the pointsAwarded flag before awarding.
 * Safe to call multiple times — only awards once per appointment.
 */
export async function guardAndAwardForAppointment(
  appointmentId: string,
  customerId: string,
  salonId: string,
  totalLkr: number
): Promise<void> {
  const updated = await prisma.appointment.updateMany({
    where: { id: appointmentId, pointsAwarded: false },
    data: { pointsAwarded: true },
  });

  if (updated.count === 0) return; // already awarded

  await Promise.all([
    awardPoints({ customerId, salonId, action: "service_completed" }),
    awardPoints({ customerId, salonId, action: "spending_per_100", spendLkr: totalLkr }),
  ]);
}