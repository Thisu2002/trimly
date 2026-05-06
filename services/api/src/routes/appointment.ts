// D:\trimly\services\api\src\routes\appointment.ts

import { Router } from "express";
import { prisma } from "../lib/prisma";
import { verifyIdToken } from "../lib/auth";
import { guardAndAwardForAppointment } from "../lib/awardPoints";

const router = Router();

// ─── GET /api/appointment/list/:userSub  (customer's own appointments) ────────

router.get("/list/:userSub", async (req, res) => {
  try {
    const { userSub } = req.params;
    if (!userSub) return res.status(401).json({ error: "Missing user" });

    const user = await prisma.user.findUnique({
      where: { auth0Sub: userSub },
      include: { customerProfile: true },
    });

    if (!user?.customerProfile) {
      return res.status(400).json({ error: "Customer profile not found" });
    }

    const appointments = await prisma.appointment.findMany({
      where: { customerId: user.customerProfile.id },
      include: {
        salon: true,
        services: {
          include: {
            service: true,
            stylist: { include: { user: true } },
          },
          orderBy: { sequence: "asc" },
        },
      },
      orderBy: { date: "desc" },
    });

    res.json(
      appointments.map((a) => ({
        id: a.id,
        salonName: a.salon.name,
        salonId: a.salonId,
        date: a.date,
        startTime: a.startTime,
        endTime: a.endTime,
        totalLkr: a.totalLkr,
        status: a.status,
        services: a.services.map((s) => ({
          name: s.service.name,
          stylist: s.stylist.user.name,
          startTime: s.startTime,
          endTime: s.endTime,
          priceLkr: s.priceLkr,
        })),
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
});

// ─── GET /api/appointment/salon  (admin view of their salon's appointments) ───

router.get("/salon", async (req, res) => {
  try {
    const idToken = String(req.query.idToken || "");
    if (!idToken) return res.status(401).json({ error: "Missing token" });

    const payload = await verifyIdToken(idToken);
    const sub = String(payload.sub);

    const admin = await prisma.user.findUnique({
      where: { auth0Sub: sub },
      include: { adminSalon: true },
    });

    if (!admin?.adminSalon) {
      return res.status(400).json({ error: "Salon not found for admin" });
    }

    const appointments = await prisma.appointment.findMany({
      where: { salonId: admin.adminSalon.id },
      include: {
        customer: { include: { user: true } },
        services: {
          include: {
            service: true,
            stylist: { include: { user: true } },
          },
          orderBy: { sequence: "asc" },
        },
      },
      orderBy: [{ date: "desc" }, { startTime: "desc" }],
    });

    res.json(
      appointments.map((a) => ({
        id: a.id,
        customerName: a.customer.user.name,
        customerEmail: a.customer.user.email,
        date: a.date,
        startTime: a.startTime,
        endTime: a.endTime,
        totalLkr: a.totalLkr,
        status: a.status,
        services: a.services.map((s) => ({
          name: s.service.name,
          stylist: s.stylist.user.name,
          startTime: s.startTime,
          endTime: s.endTime,
          priceLkr: s.priceLkr,
        })),
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch salon appointments" });
  }
});

// ─── PATCH /api/appointment/:id/complete  (admin marks appointment done) ──────
//
// This is the standard place to complete an appointment.
// The admin does this from the salon appointments view in the web dashboard
// after the customer has received the service.
// Points are awarded automatically here.

router.patch("/:id/complete", async (req, res) => {
  try {
    const idToken = req.body.idToken as string | undefined;
    if (!idToken) return res.status(401).json({ error: "Missing token" });

    const payload = await verifyIdToken(idToken);
    const sub = String(payload.sub);

    const admin = await prisma.user.findUnique({
      where: { auth0Sub: sub },
      include: { adminSalon: true },
    });

    if (!admin || admin.role !== "admin" || !admin.adminSalon) {
      return res.status(403).json({ error: "Not allowed" });
    }

    // Fetch the appointment — must belong to this admin's salon
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    if (appointment.salonId !== admin.adminSalon.id) {
      return res.status(403).json({ error: "Not your salon's appointment" });
    }

    if (appointment.status === "completed") {
      return res.json({ ok: true, message: "Already completed" });
    }

    if (appointment.status === "cancelled") {
      return res.status(400).json({ error: "Cannot complete a cancelled appointment" });
    }

    // Mark as completed
    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: "completed" },
    });

    // Award loyalty points — wrapped in try/catch so a loyalty failure
    // never rolls back the appointment completion
    try {
      await guardAndAwardForAppointment(
        appointment.id,
        appointment.customerId,
        appointment.salonId,
        appointment.totalLkr
      );
    } catch (loyaltyErr) {
      console.error("Loyalty award failed (non-fatal):", loyaltyErr);
    }

    res.json({ ok: true, appointment: { id: updated.id, status: updated.status } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to complete appointment" });
  }
});

// ─── PATCH /api/appointment/:id/cancel  (admin or customer cancels) ───────────

router.patch("/:id/cancel", async (req, res) => {
  try {
    const idToken = req.body.idToken as string | undefined;
    if (!idToken) return res.status(401).json({ error: "Missing token" });

    const payload = await verifyIdToken(idToken);
    const sub = String(payload.sub);

    const user = await prisma.user.findUnique({
      where: { auth0Sub: sub },
      include: { adminSalon: true, customerProfile: true },
    });

    if (!user) return res.status(401).json({ error: "User not found" });

    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
    });

    if (!appointment) return res.status(404).json({ error: "Not found" });

    // Allow if admin of the salon OR the customer who booked
    const isAdminOfSalon = user.role === "admin" && user.adminSalon?.id === appointment.salonId;
    const isCustomer = user.customerProfile?.id === appointment.customerId;

    if (!isAdminOfSalon && !isCustomer) {
      return res.status(403).json({ error: "Not allowed" });
    }

    if (appointment.status === "completed") {
      return res.status(400).json({ error: "Cannot cancel a completed appointment" });
    }

    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: "cancelled" },
    });

    res.json({ ok: true, appointment: { id: updated.id, status: updated.status } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to cancel appointment" });
  }
});

export default router;