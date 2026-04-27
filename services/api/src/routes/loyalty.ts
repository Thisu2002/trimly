import { Router } from "express";
import { prisma } from "../lib/prisma";
import { resolveProgram } from "../lib/loyalty";

const router = Router();

function handleError(res: any, err: any) {
  console.error(err);
  const status = err?.status ?? 500;
  const message = err?.message ?? "Internal server error";
  return res.status(status).json({ error: message });
}

// ─── GET /api/loyalty/stats ───────────────────────────────────────────────────

router.get("/stats", async (req, res) => {
  try {
    const { idToken } = req.query;
    if (!idToken) return res.status(401).json({ error: "Missing token" });

    const programId = await resolveProgram(String(idToken));
    const program = await prisma.loyaltyProgram.findUnique({
      where: { id: programId },
      include: {
        tiers: { include: { customerPoints: true } },
        rewards: { include: { redemptions: true } },
      },
    });
    if (!program) return res.status(404).json({ error: "Not found" });

    const allCustomerPoints = program.tiers.flatMap((t) => t.customerPoints);
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    res.json({
      totalMembers: allCustomerPoints.length,
      activeMembers: allCustomerPoints.filter((cp) => cp.updatedAt > ninetyDaysAgo).length,
      pointsIssued: allCustomerPoints.reduce((sum, cp) => sum + cp.lifetimePoints, 0),
      rewardsRedeemed: program.rewards.reduce((sum, r) => sum + r.redemptions.length, 0),
    });
  } catch (err) {
    handleError(res, err);
  }
});

// ─── GET /api/loyalty/rules ───────────────────────────────────────────────────

router.get("/rules", async (req, res) => {
  try {
    const { idToken } = req.query;
    if (!idToken) return res.status(401).json({ error: "Missing token" });
    const programId = await resolveProgram(String(idToken));
    const rules = await prisma.loyaltyRule.findMany({
      where: { programId },
      orderBy: { createdAt: "asc" },
    });
    res.json(rules);
  } catch (err) {
    handleError(res, err);
  }
});

// ─── PATCH /api/loyalty/rules/:id ────────────────────────────────────────────

router.patch("/rules/:id", async (req, res) => {
  try {
    const { idToken, points } = req.body;
    if (!idToken) return res.status(401).json({ error: "Missing token" });
    await resolveProgram(String(idToken));
    const rule = await prisma.loyaltyRule.update({
      where: { id: req.params.id },
      data: { points },
    });
    res.json(rule);
  } catch (err) {
    handleError(res, err);
  }
});

// ─── GET /api/loyalty/tiers ───────────────────────────────────────────────────

router.get("/tiers", async (req, res) => {
  try {
    const { idToken } = req.query;
    if (!idToken) return res.status(401).json({ error: "Missing token" });
    const programId = await resolveProgram(String(idToken));
    const tiers = await prisma.loyaltyTier.findMany({
      where: { programId },
      orderBy: { sortOrder: "asc" },
    });
    res.json(tiers);
  } catch (err) {
    handleError(res, err);
  }
});

// ─── PATCH /api/loyalty/tiers/:id ────────────────────────────────────────────

router.patch("/tiers/:id", async (req, res) => {
  try {
    const { idToken, threshold, multiplier, benefits } = req.body;
    if (!idToken) return res.status(401).json({ error: "Missing token" });
    await resolveProgram(String(idToken));
    const tier = await prisma.loyaltyTier.update({
      where: { id: req.params.id },
      data: { threshold, multiplier, benefits },
    });
    res.json(tier);
  } catch (err) {
    handleError(res, err);
  }
});

// ─── GET /api/loyalty/rewards ─────────────────────────────────────────────────

router.get("/rewards", async (req, res) => {
  try {
    const { idToken } = req.query;
    if (!idToken) return res.status(401).json({ error: "Missing token" });
    const programId = await resolveProgram(String(idToken));
    const rewards = await prisma.loyaltyReward.findMany({
      where: { programId },
      include: { _count: { select: { redemptions: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(
      rewards.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        pointsCost: r.pointsCost,
        tierRequired: r.tierRequired,
        active: r.active,
        totalRedeemed: r._count.redemptions,
      }))
    );
  } catch (err) {
    handleError(res, err);
  }
});

// ─── POST /api/loyalty/rewards ────────────────────────────────────────────────

router.post("/rewards", async (req, res) => {
  try {
    const { idToken, name, description, pointsCost, tierRequired, active } = req.body;
    if (!idToken) return res.status(401).json({ error: "Missing token" });
    const programId = await resolveProgram(String(idToken));
    const reward = await prisma.loyaltyReward.create({
      data: { programId, name, description, pointsCost, tierRequired, active: active ?? true },
    });
    res.json({ ...reward, totalRedeemed: 0 });
  } catch (err) {
    handleError(res, err);
  }
});

// ─── PATCH /api/loyalty/rewards/:id ──────────────────────────────────────────

router.patch("/rewards/:id", async (req, res) => {
  try {
    const { idToken, name, description, pointsCost, tierRequired, active } = req.body;
    if (!idToken) return res.status(401).json({ error: "Missing token" });
    await resolveProgram(String(idToken));

    const data: Record<string, any> = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (pointsCost !== undefined) data.pointsCost = pointsCost;
    if (tierRequired !== undefined) data.tierRequired = tierRequired;
    if (active !== undefined) data.active = active;

    const reward = await prisma.loyaltyReward.update({
      where: { id: req.params.id },
      data,
    });
    res.json(reward);
  } catch (err) {
    handleError(res, err);
  }
});

// ─── DELETE /api/loyalty/rewards/:id ─────────────────────────────────────────

router.delete("/rewards/:id", async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(401).json({ error: "Missing token" });
    await resolveProgram(String(idToken));
    await prisma.loyaltyReward.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    handleError(res, err);
  }
});

// ─── POST /api/loyalty/award-points ──────────────────────────────────────────

router.post("/award-points", async (req, res) => {
  try {
    const { idToken, customerId, action, spendLkr } = req.body;
    if (!idToken) return res.status(401).json({ error: "Missing token" });

    const programId = await resolveProgram(String(idToken));
    const rule = await prisma.loyaltyRule.findUnique({
      where: { programId_action: { programId, action } },
    });
    if (!rule) return res.status(404).json({ error: "Rule not found" });

    let pointsToAdd = rule.points;
    if (action === "spending_per_100" && spendLkr) {
      pointsToAdd = Math.floor(spendLkr / 100) * rule.points;
    }

    const cp = await prisma.customerPoints.upsert({
      where: { customerId },
      create: { customerId, totalPoints: pointsToAdd, lifetimePoints: pointsToAdd },
      update: {
        totalPoints: { increment: pointsToAdd },
        lifetimePoints: { increment: pointsToAdd },
      },
    });

    const newLifetime = cp.lifetimePoints + pointsToAdd;
    const tiers = await prisma.loyaltyTier.findMany({
      where: { programId },
      orderBy: { sortOrder: "desc" },
    });
    const newTier = tiers.find((t) => newLifetime >= t.threshold) ?? tiers[tiers.length - 1];

    await prisma.customerPoints.update({
      where: { customerId },
      data: { tierId: newTier.id },
    });

    res.json({ pointsAdded: pointsToAdd, newTotal: cp.totalPoints + pointsToAdd });
  } catch (err) {
    handleError(res, err);
  }
});

export default router;