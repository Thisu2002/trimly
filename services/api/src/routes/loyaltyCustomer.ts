// ADD this router to your existing loyalty.ts routes file
// Or register as a separate file at routes/loyaltyCustomer.ts
// Mount in app.ts: app.use("/api/loyalty/customer", loyaltyCustomerRouter)

import { Router } from "express";
import { prisma } from "../lib/prisma";
import { verifyIdToken } from "../lib/auth";

const router = Router();

function handleError(res: any, err: any) {
  console.error(err);
  const status = err?.status ?? 500;
  const message = err?.message ?? "Internal server error";
  return res.status(status).json({ error: message });
}

/**
 * Resolves the customer record from an id token.
 * Customers belong to a salon via their appointment history —
 * we find the most recently active salon's loyalty program.
 */
async function resolveCustomer(idToken: string) {
  const payload = await verifyIdToken(idToken);
  const sub = String(payload.sub);

  const user = await prisma.user.findUnique({
    where: { auth0Sub: sub },
    include: {
      customerProfile: {
        include: {
          loyaltyPoints: { include: { tier: true } },
        },
      },
    },
  });

  if (!user) throw { status: 401, message: "User not found" };
  if (!user.customerProfile) throw { status: 400, message: "No customer profile" };

  return { user, customer: user.customerProfile };
}

/**
 * Find the loyalty program for the salon the customer most recently visited.
 * Customers book at one salon at a time (each salon has its own program).
 */
async function resolveSalonProgramForCustomer(customerId: string) {
  // Get the most recent completed appointment to determine which salon
  const latestAppointment = await prisma.appointment.findFirst({
    where: { customerId, status: "completed" },
    orderBy: { date: "desc" },
    select: { salonId: true },
  });

  if (!latestAppointment) return null;

  const program = await prisma.loyaltyProgram.findUnique({
    where: { salonId: latestAppointment.salonId },
  });

  return program;
}

// ─── GET /api/loyalty/customer/summary ───────────────────────────────────────
// Full loyalty summary: points, tier, available rewards, recent history, tiers roadmap

router.get("/summary", async (req, res) => {
  try {
    const { idToken, salonId } = req.query;
    if (!idToken) return res.status(401).json({ error: "Missing token" });

    const { customer } = await resolveCustomer(String(idToken));

    // If salonId is not passed, derive from most recent appointment
    let programSalonId = salonId ? String(salonId) : null;
    console.log("Resolving loyalty summary for customer", customer.id, "salonId param:", programSalonId);
    if (!programSalonId) {
      const latest = await prisma.appointment.findFirst({
        where: { customerId: customer.id, status: "completed" },
        orderBy: { date: "desc" },
        select: { salonId: true },
      });
      if (latest) programSalonId = latest.salonId;
    }
    console.log("Determined programSalonId:", programSalonId);

    if (!programSalonId) {
      // Customer has no completed appointments yet — return empty state
      return res.json({
        points: null,
        tiers: [],
        currentTier: null,
        availableRewards: [],
        redemptionHistory: [],
        rules: [],
      });
    }

    const program = await prisma.loyaltyProgram.findUnique({
      where: { salonId: programSalonId },
      include: {
        tiers: { orderBy: { sortOrder: "asc" } },
        rules: { orderBy: { createdAt: "asc" } },
        rewards: {
          where: { active: true },
          include: { _count: { select: { redemptions: true } } },
          orderBy: { pointsCost: "asc" },
        },
      },
    });

    if (!program) {
      return res.json({
        points: null,
        tiers: [],
        currentTier: null,
        availableRewards: [],
        redemptionHistory: [],
        rules: [],
      });
    }

    // Customer's points balance
    const cp = customer.loyaltyPoints;
    const totalPoints = cp?.totalPoints ?? 0;
    const lifetimePoints = cp?.lifetimePoints ?? 0;

    // Current tier (from CustomerPoints.tierId or fall back to lowest)
    const currentTier = cp?.tier ?? program.tiers[0] ?? null;

    // Next tier
    const currentTierIndex = program.tiers.findIndex((t) => t.id === currentTier?.id);
    const nextTier = program.tiers[currentTierIndex + 1] ?? null;
    const pointsToNextTier = nextTier ? nextTier.threshold - lifetimePoints : 0;
    const tierProgress = nextTier
      ? Math.min(
          100,
          Math.round(
            ((lifetimePoints - (currentTier?.threshold ?? 0)) /
              (nextTier.threshold - (currentTier?.threshold ?? 0))) *
              100
          )
        )
      : 100;

    // Rewards — mark each as redeemable based on points balance + tier
    const unlockedTierIndexes = program.tiers
      .filter((t) => lifetimePoints >= t.threshold)
      .map((t) => t.name);

    const availableRewards = program.rewards.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      pointsCost: r.pointsCost,
      tierRequired: r.tierRequired,
      totalRedeemed: r._count.redemptions,
      canRedeem:
        totalPoints >= r.pointsCost && unlockedTierIndexes.includes(r.tierRequired),
      tierLocked: !unlockedTierIndexes.includes(r.tierRequired),
    }));

    // Redemption history (last 20)
    const redemptions = await prisma.rewardRedemption.findMany({
      where: { customerId: customer.id },
      include: { reward: { select: { name: true } } },
      orderBy: { redeemedAt: "desc" },
      take: 20,
    });

    // Points earning history — derive from appointments (last 20 completed)
    const recentAppointments = await prisma.appointment.findMany({
      where: { customerId: customer.id, status: "completed", salonId: programSalonId },
      orderBy: { date: "desc" },
      take: 20,
      select: { id: true, date: true, totalLkr: true },
    });

    // Build unified history: appointments (earned) + redemptions (spent)
    const earnedHistory = recentAppointments.map((a) => ({
      type: "earned" as const,
      label: "Service Completed",
      description: `Appointment on ${new Date(a.date).toLocaleDateString("en-LK", { month: "short", day: "numeric" })}`,
      points: program.rules.find((r) => r.action === "service_completed")?.points ?? 10,
      date: a.date.toISOString(),
    }));

    const spentHistory = redemptions.map((r) => ({
      type: "spent" as const,
      label: "Reward Redeemed",
      description: r.reward.name,
      points: -r.pointsSpent,
      date: r.redeemedAt.toISOString(),
    }));

    const history = [...earnedHistory, ...spentHistory]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);

    res.json({
      points: {
        total: totalPoints,
        lifetime: lifetimePoints,
        toNextTier: pointsToNextTier > 0 ? pointsToNextTier : 0,
        tierProgress,
      },
      currentTier: currentTier
        ? {
            id: currentTier.id,
            name: currentTier.name,
            threshold: currentTier.threshold,
            multiplier: currentTier.multiplier,
            benefits: currentTier.benefits,
            sortOrder: currentTier.sortOrder,
          }
        : null,
      nextTier: nextTier
        ? { name: nextTier.name, threshold: nextTier.threshold, sortOrder: nextTier.sortOrder }
        : null,
      tiers: program.tiers.map((t) => ({
        id: t.id,
        name: t.name,
        threshold: t.threshold,
        multiplier: t.multiplier,
        benefits: t.benefits,
        sortOrder: t.sortOrder,
        unlocked: lifetimePoints >= t.threshold,
        isCurrent: t.id === currentTier?.id,
      })),
      availableRewards,
      history,
      rules: program.rules.map((r) => ({
        id: r.id,
        action: r.action,
        label: r.label,
        description: r.description,
        points: r.points,
        iconKey: r.iconKey,
        colorKey: r.colorKey,
      })),
    });
  } catch (err) {
    handleError(res, err);
  }
});

// ─── POST /api/loyalty/customer/redeem ───────────────────────────────────────

router.post("/redeem", async (req, res) => {
  try {
    const { idToken, rewardId, salonId } = req.body;
    if (!idToken || !rewardId) return res.status(400).json({ error: "Missing fields" });

    const { customer } = await resolveCustomer(String(idToken));

    const reward = await prisma.loyaltyReward.findUnique({
      where: { id: rewardId },
      include: { program: true },
    });
    if (!reward || !reward.active) return res.status(404).json({ error: "Reward not found" });

    const cp = customer.loyaltyPoints;
    if (!cp || cp.totalPoints < reward.pointsCost) {
      return res.status(400).json({ error: "Insufficient points" });
    }

    // Tier check
    const program = await prisma.loyaltyProgram.findUnique({
      where: { id: reward.programId },
      include: { tiers: { orderBy: { sortOrder: "asc" } } },
    });
    const unlockedTierNames = program!.tiers
      .filter((t) => cp.lifetimePoints >= t.threshold)
      .map((t) => t.name);

    if (!unlockedTierNames.includes(reward.tierRequired)) {
      return res.status(400).json({ error: "Tier requirement not met" });
    }

    // Deduct points + create redemption record in a transaction
    await prisma.$transaction([
      prisma.customerPoints.update({
        where: { customerId: customer.id },
        data: { totalPoints: { decrement: reward.pointsCost } },
      }),
      prisma.rewardRedemption.create({
        data: {
          customerId: customer.id,
          rewardId: reward.id,
          pointsSpent: reward.pointsCost,
        },
      }),
    ]);

    res.json({
      ok: true,
      message: `Successfully redeemed "${reward.name}"`,
      pointsSpent: reward.pointsCost,
      newBalance: cp.totalPoints - reward.pointsCost,
    });
  } catch (err) {
    handleError(res, err);
  }
});

export default router;