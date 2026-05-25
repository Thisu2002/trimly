// D:\trimly\services\api\src\routes\users.ts
import { Router } from "express";
import { prisma } from "../lib/prisma";
import { verifyIdToken } from "../lib/auth";

const router = Router();

async function requireAuth(
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction
) {
  try {
    const authHeader = req.headers.authorization ?? "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;
    if (!token) return res.status(401).json({ error: "Missing token" });

    const payload = await verifyIdToken(token);
    const sub = String(payload.sub);

    const user = await prisma.user.findUnique({
      where: { auth0Sub: sub },
      include: { customerProfile: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.locals.user = user;
    next();
  } catch (e) {
    console.error("[users] auth error:", e);
    return res.status(401).json({ error: "Invalid token" });
  }
}

// GET /api/users/me
router.get("/me", requireAuth, async (_req, res) => {
  const user = res.locals.user;
  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    address: user.address ?? null,
    role: user.role,
  });
});

// PATCH /api/users/me

router.patch("/me", requireAuth, async (req, res) => {
  const user = res.locals.user;

  const { name, phone, address } = req.body as {
    name?: string;
    phone?: string;
    address?: string;
  };

  // At least one field must be provided
  if (name === undefined && phone === undefined && address === undefined) {
    return res.status(400).json({ error: "No fields to update" });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(phone !== undefined && { phone: phone.trim() || null }),
      ...(address !== undefined && { address: address.trim() || null }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      role: true,
    },
  });

  return res.json(updated);
});

export default router;