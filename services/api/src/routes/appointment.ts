import { Router } from "express";
import { prisma } from "../lib/prisma";

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

export default router;
