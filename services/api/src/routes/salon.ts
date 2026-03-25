import { Router } from "express";
import { prisma } from "../lib/prisma";
import { verifyIdToken } from "../lib/auth";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { idToken, name, phone, address } = req.body;

    if (!idToken) return res.status(401).json({ error: "Missing token" });

    const payload = await verifyIdToken(idToken);
    const sub = String(payload.sub);

    const user = await prisma.user.findUnique({
      where: { auth0Sub: sub },
      include: { adminSalon: true },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.role !== "admin")
      return res.status(403).json({ error: "Not an admin" });

    if (user.adminSalon) {
      return res.status(400).json({ error: "Salon already exists" });
    }

    const salon = await prisma.salon.create({
      data: { name, phone, address, adminUserId: user.id },
    });

    res.json(salon);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create salon" });
  }
});

export default router;