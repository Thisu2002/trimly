// D:\trimly\services\api\src\routes\loyaltyCustomer.ts
// Mount in app.ts: app.use("/api/loyalty/customer", loyaltyCustomerRouter)

import { Router } from "express";
import { prisma } from "../lib/prisma";
import { verifyIdToken } from "../lib/auth";

const router = Router();

function handleError(res: any, err: any) {
  console.error(err);
  return res.status(err?.status ?? 500).json({ error: err?.message ?? "Internal server error" });
}

async function resolveCustomer(idToken: string) {
  const payload = await verifyIdToken(idToken);
  const sub = String(payload.sub);

  const user = await prisma.user.findUnique({
    where: { auth0Sub: sub },
    include: { customerProfile: true },
  });

  if (!user) throw { status: 401, message: "User not found" };
  if (!user.customerProfile) throw { status: 400, message: "No customer profile" };

  return { user, customer: user.customerProfile };
}

// ─── GET /api/loyalty/customer/salons ────────────────────────────────────────
// Returns all salons the customer has visited (any appointment status),
// with their loyalty program info if one exists.
// This is used to populate the salon selector on the LoyaltyScreen.

router.get("/salons", async (req, res) => {
  try {
    const { idToken } = req.query;
    if (!idToken) return res.status(401).json({ error: "Missing token" });

    const { customer } = await resolveCustomer(String(idToken));

    // Find all distinct salons this customer has booked at
    const appointments = await prisma.appointment.findMany({
      where: { customerId: customer.id },
      select: { salonId: true },
      distinct: ["salonId"],
    });

    if (appointments.length === 0) return res.json([]);

    const salonIds = appointments.map((a) => a.salonId);

    const salons = await prisma.salon.findMany({
      where: { id: { in: salonIds } },
      include: {
        loyaltyProgram: {
          include: { tiers: { orderBy: { sortOrder: "asc" }, take: 1 } },
        },
      },
    });

    // For each salon, include whether the customer already has points
    const customerPointsRecords = await prisma.customerPoints.findMany({
      where: {
        customerId: customer.id,
        program: { salonId: { in: salonIds } },
      },
      include: { program: { select: { salonId: true } } },
    });

    const pointsBySalon = new Map(
      customerPointsRecords.map((cp) => [cp.program.salonId, cp])
    );

    res.json(
      salons.map((salon) => ({
        salonId: salon.id,
        salonName: salon.name,
        hasLoyaltyProgram: !!salon.loyaltyProgram,
        customerPoints: pointsBySalon.get(salon.id)?.totalPoints ?? null,
        // null means no points record yet (hasn't completed an appointment)
      }))
    );
  } catch (err) {
    handleError(res, err);
  }
});

// ─── GET /api/loyalty/customer/summary ───────────────────────────────────────
// Full loyalty data for one specific salon.
// Requires salonId — customer must have at least one appointment at this salon.

router.get("/summary", async (req, res) => {
  try {
    const { idToken, salonId } = req.query;
    if (!idToken) return res.status(401).json({ error: "Missing token" });
    if (!salonId) return res.status(400).json({ error: "salonId is required" });

    const { customer } = await resolveCustomer(String(idToken));

    // Gate: customer must have at least one appointment at this salon
    const hasAppointment = await prisma.appointment.findFirst({
      where: { customerId: customer.id, salonId: String(salonId) },
      select: { id: true },
    });

    if (!hasAppointment) {
      return res.status(403).json({ error: "No appointments at this salon" });
    }

    const program = await prisma.loyaltyProgram.findUnique({
      where: { salonId: String(salonId) },
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
      // Salon has no loyalty program yet
      return res.json({
        points: null,
        tiers: [],
        currentTier: null,
        nextTier: null,
        availableRewards: [],
        history: [],
        rules: [],
      });
    }

    // Customer's points for this specific salon
    const cp = await prisma.customerPoints.findUnique({
      where: { customerId_programId: { customerId: customer.id, programId: program.id } },
      include: { tier: true },
    });

    const totalPoints = cp?.totalPoints ?? 0;
    const lifetimePoints = cp?.lifetimePoints ?? 0;

    const currentTier = cp?.tier ?? program.tiers[0] ?? null;
    const currentTierIndex = program.tiers.findIndex((t) => t.id === currentTier?.id);
    const nextTier = program.tiers[currentTierIndex + 1] ?? null;

    const pointsToNextTier = nextTier ? Math.max(0, nextTier.threshold - lifetimePoints) : 0;
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

    const unlockedTierNames = program.tiers
      .filter((t) => lifetimePoints >= t.threshold)
      .map((t) => t.name);

    const availableRewards = program.rewards.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      pointsCost: r.pointsCost,
      tierRequired: r.tierRequired,
      totalRedeemed: r._count.redemptions,
      canRedeem: totalPoints >= r.pointsCost && unlockedTierNames.includes(r.tierRequired),
      tierLocked: !unlockedTierNames.includes(r.tierRequired),
    }));

    // Redemption history for this salon's program
    const redemptions = await prisma.rewardRedemption.findMany({
      where: {
        customerId: customer.id,
        reward: { programId: program.id },
      },
      include: { reward: { select: { name: true } } },
      orderBy: { redeemedAt: "desc" },
      take: 20,
    });

    // Earning history from completed appointments at this salon
    const recentAppointments = await prisma.appointment.findMany({
      where: {
        customerId: customer.id,
        salonId: String(salonId),
        status: "completed",
        pointsAwarded: true, // only show appointments where points were actually given
      },
      orderBy: { date: "desc" },
      take: 20,
      select: { id: true, date: true, totalLkr: true },
    });

    const serviceRule = program.rules.find((r) => r.action === "service_completed");
    const spendRule = program.rules.find((r) => r.action === "spending_per_100");

    const earnedHistory = recentAppointments.map((a) => {
      const servicePoints = serviceRule?.points ?? 0;
      const spendPoints = spendRule ? Math.floor(a.totalLkr / 100) * spendRule.points : 0;
      return {
        type: "earned" as const,
        label: "Service Completed",
        description: `Appointment on ${new Date(a.date).toLocaleDateString("en-LK", { month: "short", day: "numeric" })}`,
        points: servicePoints + spendPoints,
        date: a.date.toISOString(),
      };
    });

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
      points: { total: totalPoints, lifetime: lifetimePoints, toNextTier: pointsToNextTier, tierProgress },
      currentTier: currentTier
        ? { id: currentTier.id, name: currentTier.name, threshold: currentTier.threshold, multiplier: currentTier.multiplier, benefits: currentTier.benefits, sortOrder: currentTier.sortOrder }
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
    const { idToken, rewardId } = req.body;
    if (!idToken || !rewardId) return res.status(400).json({ error: "Missing fields" });

    const { customer } = await resolveCustomer(String(idToken));

    const reward = await prisma.loyaltyReward.findUnique({
      where: { id: rewardId },
      include: { program: { include: { tiers: { orderBy: { sortOrder: "asc" } } } } },
    });
    if (!reward || !reward.active) return res.status(404).json({ error: "Reward not found" });

    const cp = await prisma.customerPoints.findUnique({
      where: { customerId_programId: { customerId: customer.id, programId: reward.programId } },
    });

    if (!cp || cp.totalPoints < reward.pointsCost) {
      return res.status(400).json({ error: "Insufficient points" });
    }

    const unlockedTierNames = reward.program.tiers
      .filter((t) => cp.lifetimePoints >= t.threshold)
      .map((t) => t.name);

    if (!unlockedTierNames.includes(reward.tierRequired)) {
      return res.status(400).json({ error: "Tier requirement not met" });
    }

    await prisma.$transaction([
      prisma.customerPoints.update({
        where: { customerId_programId: { customerId: customer.id, programId: reward.programId } },
        data: { totalPoints: { decrement: reward.pointsCost } },
      }),
      prisma.rewardRedemption.create({
        data: { customerId: customer.id, rewardId: reward.id, pointsSpent: reward.pointsCost },
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