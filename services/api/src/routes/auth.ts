// D:\trimly\services\api\src\routes\auth.ts
import { Router } from "express";
import { prisma } from "../lib/prisma";
import { verifyIdToken } from "../lib/auth";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: "idToken required" });

    const payload = await verifyIdToken(idToken);

    const sub = String(payload.sub);
    const email = payload.email as string | undefined;

    if (!email) {
      return res.status(400).json({ error: "email missing in token" });
    }

    const rawRoles = payload["https://trimly.app/roles"];
    const authRoles = Array.isArray(rawRoles) ? rawRoles.map(String) : [];
    const role: "admin" | "stylist" | "customer" = authRoles.includes("admin")
      ? "admin"
      : authRoles.includes("stylist")
        ? "stylist"
        : "customer";

    const existing = await prisma.user.findUnique({ where: { auth0Sub: sub } });
    const isNewUser = !existing;

    const user = await prisma.user.upsert({
      where: { auth0Sub: sub },
      update: {
        email,
        role,
      },
      create: {
        auth0Sub: sub,
        email,
        name: email.split("@")[0],
        role,
      },
      include: {
        adminSalon: true,
        customerProfile: true,
        stylistProfile: true,
      },
    });

    if (role === "customer") {
      await prisma.customer.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id },
      });
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        adminSalon: true,
        customerProfile: true,
        stylistProfile: true,
      },
    });

    return res.json({ user: fullUser, isNewUser });
  } catch (e) {
    console.error("Auth error:", e);
    return res.status(401).json({ error: "Invalid token" });
  }
});

router.post("/me", async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: "idToken required" });

    const payload = await verifyIdToken(idToken);

    const sub = String(payload.sub);
    const email = payload.email as string | undefined;

    if (!email)
      return res.status(400).json({ error: "email missing in token" });

    const userName = email.split("@")[0];

    const rawRoles = payload["https://trimly.app/roles"];
    const authRoles = Array.isArray(rawRoles) ? rawRoles.map(String) : [];

    const role: "admin" | "stylist" | "customer" = authRoles.includes("admin")
      ? "admin"
      : authRoles.includes("stylist")
        ? "stylist"
        : "customer";

    let user = await prisma.user.findUnique({
      where: { auth0Sub: sub },
      include: { adminSalon: true },
    });

    if (!user) {
      console.log("No user found with sub, creating new user");
      user = await prisma.user.create({
        data: { auth0Sub: sub, email, role, name: userName },
        include: { adminSalon: true },
      });
    }

    return res.json({ user });
  } catch (e) {
    console.error("Auth error:", e);
    return res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
