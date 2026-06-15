// D:\trimly\services\api\src\routes\review.ts

import { Router } from "express";
import { prisma } from "../lib/prisma";
import { awardPoints } from "../lib/awardPoints";
import { verifyIdToken } from "../lib/auth";

const router = Router();

// ─── Helper: recalculate and persist avgRating on the Salon row ───────────────
// Called after any review is created or deleted so the denormalized field
// used by the /salons listing for sort/filter is always accurate.
async function syncSalonAvgRating(salonId: string) {
  const agg = await prisma.appointmentReview.aggregate({
    where: { salonId },
    _avg: { rating: true },
  });
  await prisma.salon.update({
    where: { id: salonId },
    data: { avgRating: agg._avg.rating ?? 0 },
  });
}

// ─── GET /api/review/check/:appointmentId ─────────────────────────────────────
router.get("/check/:appointmentId", async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { userSub } = req.query as { userSub?: string };
    if (!userSub) return res.status(401).json({ error: "Missing userSub" });

    const review = await prisma.appointmentReview.findUnique({
      where: { appointmentId },
      select: { id: true, rating: true, comment: true, createdAt: true },
    });

    res.json({ reviewed: !!review, review: review ?? null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to check review status" });
  }
});

// ─── POST /api/review/batch-check ────────────────────────────────────────────
router.post("/batch-check", async (req, res) => {
  try {
    const { appointmentIds } = req.body as { appointmentIds?: string[] };
    if (!Array.isArray(appointmentIds) || appointmentIds.length === 0) {
      return res.json({ reviewed: {} });
    }

    const reviews = await prisma.appointmentReview.findMany({
      where: { appointmentId: { in: appointmentIds } },
      select: { appointmentId: true, rating: true, comment: true },
    });

    const reviewed: Record<string, { rating: number; comment: string | null }> =
      {};
    for (const r of reviews) {
      reviewed[r.appointmentId] = { rating: r.rating, comment: r.comment };
    }

    res.json({ reviewed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to batch check reviews" });
  }
});

// ─── POST /api/review ─────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { userSub, appointmentId, rating, comment } = req.body as {
      userSub?: string;
      appointmentId?: string;
      rating?: number;
      comment?: string;
    };

    if (!userSub) return res.status(401).json({ error: "Missing userSub" });
    if (!appointmentId)
      return res.status(400).json({ error: "Missing appointmentId" });
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be 1–5" });
    }

    const user = await prisma.user.findUnique({
      where: { auth0Sub: userSub },
      include: { customerProfile: true },
    });
    if (!user?.customerProfile) {
      return res.status(400).json({ error: "Customer profile not found" });
    }
    const customerId = user.customerProfile.id;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });
    if (!appointment)
      return res.status(404).json({ error: "Appointment not found" });
    if (appointment.customerId !== customerId)
      return res.status(403).json({ error: "Not your appointment" });
    if (appointment.status !== "completed")
      return res
        .status(400)
        .json({ error: "Can only review completed appointments" });

    const existing = await prisma.appointmentReview.findUnique({
      where: { appointmentId },
    });
    if (existing)
      return res
        .status(409)
        .json({ error: "Already reviewed", review: existing });

    const review = await prisma.appointmentReview.create({
      data: {
        appointmentId,
        customerId,
        salonId: appointment.salonId,
        rating,
        comment: comment?.trim() || null,
        pointsAwarded: false,
      },
    });

    // ── Keep avgRating in sync ────────────────────────────────────────────────
    // Fire-and-forget: non-fatal if it fails, listing will self-correct next
    // time but in practice this keeps the value current immediately.
    syncSalonAvgRating(appointment.salonId).catch((err) =>
      console.error("syncSalonAvgRating failed (non-fatal):", err),
    );

    // ── Loyalty points ────────────────────────────────────────────────────────
    let pointsResult = null;
    try {
      const updated = await prisma.appointmentReview.updateMany({
        where: { id: review.id, pointsAwarded: false },
        data: { pointsAwarded: true },
      });

      if (updated.count > 0) {
        pointsResult = await awardPoints({
          customerId,
          salonId: appointment.salonId,
          action: "review_submitted",
          reviewId: review.id,
        });
      }
    } catch (loyaltyErr) {
      console.error("Loyalty award for review failed (non-fatal):", loyaltyErr);
    }

    res.status(201).json({
      ok: true,
      review: { id: review.id, rating: review.rating, comment: review.comment },
      loyalty: pointsResult
        ? {
            pointsAdded: pointsResult.pointsAdded,
            newTotal: pointsResult.newTotal,
            tierChanged: pointsResult.tierChanged,
            newTierName: pointsResult.newTierName,
          }
        : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit review" });
  }
});

// ─── GET /api/review/salon ───────────────────────────────────────────────────
router.get("/salon", async (req, res) => {
  try {
    const idToken = req.query.idToken as string | undefined;
    if (!idToken) return res.status(401).json({ error: "Missing idToken" });

    const decoded = await verifyIdToken(idToken); // your existing helper
    const sub = String(decoded.sub);
    const user = await prisma.user.findUnique({
      where: { auth0Sub: sub },
      include: { adminSalon: true },
    });
    if (!user?.adminSalon)
      return res.status(400).json({ error: "Salon not found for admin" });

    const reviews = await prisma.appointmentReview.findMany({
      where: { salonId: user.adminSalon.id },
      include: {
        customer: { include: { user: true } },
        appointment: { select: { date: true, startTime: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(
      reviews.map((r) => ({
        id: r.id,
        customerName: r.customer.user.name,
        rating: r.rating,
        comment: r.comment,
        appointmentDate: r.appointment.date,
        createdAt: r.createdAt,
      })),
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch salon reviews" });
  }
});

export default router;
