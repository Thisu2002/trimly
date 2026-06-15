//D:\trimly\services\api\src\routes\service.ts
import { Router } from "express";
import { prisma } from "../lib/prisma";
import { verifyIdToken } from "../lib/auth";
import { detectStyleId } from "../utils/styleMatcher";

const router = Router();

// POST / — create service
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

    const detectedStyleId = await detectStyleId(name);

    const service = await prisma.service.create({
      data: {
        name,
        description,
        durationMin,
        priceLkr,
        salonId: user.adminSalon.id,
        categoryId: finalCategoryId || null,
        styleId: detectedStyleId,
      },
    });

    res.json({ service, createdCategoryId: finalCategoryId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create service" });
  }
});

// GET /categories
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

// GET /list
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
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    res.json(services);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch services" });
  }
});

// GET /:id — fetch single service for edit modal
router.get("/:id", async (req, res) => {
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

    const service = await prisma.service.findFirst({
      where: {
        id: req.params.id,
        salonId: user.adminSalon.id,
      },
      include: { category: true },
    });

    if (!service) return res.status(404).json({ error: "Service not found" });

    res.json(service);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch service" });
  }
});

// PUT /:id — update service
router.put("/:id", async (req, res) => {
  try {
    const { idToken, name, description, durationMin, priceLkr, categoryId } =
      req.body;

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
      return res.status(400).json({ error: "No salon" });

    // Verify the service belongs to this salon
    const existing = await prisma.service.findFirst({
      where: { id: req.params.id, salonId: user.adminSalon.id },
    });

    if (!existing) return res.status(404).json({ error: "Service not found" });

    const detectedStyleId = name !== existing.name
      ? await detectStyleId(name)
      : existing.styleId;

    const updated = await prisma.service.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        durationMin,
        priceLkr,
        categoryId,
        styleId: detectedStyleId,
      },
      include: { category: true },
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update service" });
  }
});

// DELETE /:id
router.delete("/:id", async (req, res) => {
  try {
    const { idToken } = req.query;
    if (!idToken) return res.status(401).json({ error: "Missing token" });

    const payload = await verifyIdToken(String(idToken));
    const sub = String(payload.sub);

    const user = await prisma.user.findUnique({
      where: { auth0Sub: sub },
      include: { adminSalon: true },
    });

    if (!user || user.role !== "admin")
      return res.status(403).json({ error: "Not allowed" });

    if (!user.adminSalon)
      return res.status(400).json({ error: "No salon" });

    // Verify the service belongs to this salon
    const existing = await prisma.service.findFirst({
      where: { id: req.params.id, salonId: user.adminSalon.id },
    });

    if (!existing) return res.status(404).json({ error: "Service not found" });

    await prisma.service.delete({ where: { id: req.params.id } });

    res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    // Prisma foreign key constraint (service is used in appointments)
    if (err.code === "P2003") {
      return res
        .status(409)
        .json({ error: "Cannot delete service linked to existing appointments" });
    }
    res.status(500).json({ error: "Failed to delete service" });
  }
});

export default router;