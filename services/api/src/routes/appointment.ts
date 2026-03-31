import { Router } from "express";
import { prisma } from "../lib/prisma";
import { verifyIdToken } from "../lib/auth";

const router = Router();

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
            stylist: {
              include: { user: true },
            },
          },
          orderBy: { sequence: "asc" },
        },
      },
      orderBy: { date: "desc" },
    });

    const formatted = appointments.map((a) => ({
      id: a.id,
      salonName: a.salon.name,
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
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
});

router.get("/salon", async (req, res) => {
  try {
    const idToken = String(req.query.idToken || "");
    
        if (!idToken) {
          return res.status(401).json({ error: "Missing token" });
        }
    
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
        customer: {
          include: {
            user: true,
          },
        },
        services: {
          include: {
            service: true,
            stylist: {
              include: { user: true },
            },
          },
          orderBy: { sequence: "asc" },
        },
      },
      orderBy: [
        { date: "desc" },
        { startTime: "desc" },
      ],
    });

    const formatted = appointments.map((a) => ({
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
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch salon appointments" });
  }
});


export default router;
