import { Router } from "express";
import { prisma } from "../lib/prisma";
import { verifyIdToken } from "../lib/auth";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { idToken, name, description, durationMin, priceLkr } = req.body;
    console.log("Request body:", req.body);

    if (!idToken) return res.status(401).json({ error: "Missing token" });

    const payload = await verifyIdToken(idToken);
    const sub = String(payload.sub);

    const user = await prisma.user.findUnique({
      where: { auth0Sub: sub },
      include: { adminSalon: true },
    });

    if (!user || user.role !== "admin")
      return res.status(403).json({ error: "Not allowed" });

    if (!user.adminSalon)
      return res.status(400).json({ error: "Create salon first" });

    const service = await prisma.service.create({
      data: {
        name,
        description,
        durationMin,
        priceLkr,
        salonId: user.adminSalon.id,
      },
    });

    res.json(service);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create service" });
  }
});

export default router;