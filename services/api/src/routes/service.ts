import { Router } from "express";
import { prisma } from "../lib/prisma";
import { verifyIdToken } from "../lib/auth";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const {
      idToken,
      name,
      description,
      durationMin,
      priceLkr,
      categoryId,
      newCategoryName,
      newCategoryDescription,
    } = req.body;

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

    let finalCategoryId = categoryId;

    if (!finalCategoryId && newCategoryName) {
      const newCategory = await prisma.category.create({
        data: {
          name: newCategoryName,
          description: newCategoryDescription,
          salonId: user.adminSalon.id,
        },
      });

      finalCategoryId = newCategory.id;
    }

    const service = await prisma.service.create({
      data: {
        name,
        description,
        durationMin,
        priceLkr,
        salonId: user.adminSalon.id,
        categoryId: finalCategoryId || null,
      },
    });

    res.json({ service, createdCategoryId: finalCategoryId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create service" });
  }
});

router.get("/categories", async (req, res) => {
  try {
    const { idToken } = req.query;
    if (!idToken) return res.status(401).json({ error: "Missing token" });

    const payload = await verifyIdToken(String(idToken));
    const sub = String(payload.sub);

    const user = await prisma.user.findUnique({
      where: { auth0Sub: sub },
      include: { adminSalon: true },
    });

    if (!user?.adminSalon) return res.status(400).json({ error: "No salon" });

    const categories = await prisma.category.findMany({
      where: { salonId: user.adminSalon.id },
      orderBy: { name: "asc" },
    });

    res.json(categories);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

router.get("/list", async (req, res) => {
  try {
    const { idToken } = req.query;
    if (!idToken) return res.status(401).json({ error: "Missing token" });

    const payload = await verifyIdToken(String(idToken));
    const sub = String(payload.sub);

    const user = await prisma.user.findUnique({
      where: { auth0Sub: sub },
      include: { adminSalon: true },
    });

    if (!user?.adminSalon) {
      return res.status(400).json({ error: "No salon" });
    }

    const services = await prisma.service.findMany({
      where: { salonId: user.adminSalon.id },
      include: {
        category: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(services);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch services" });
  }
});

export default router;
