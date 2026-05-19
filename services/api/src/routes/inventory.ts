// D:\trimly\services\api\src\routes\inventory.ts
import { Router } from "express";
import { prisma } from "../lib/prisma";
import { verifyIdToken } from "../lib/auth";

const router = Router();

// ─── Helper ────────────────────────────────────────────────────────────────

async function getAdminSalon(idToken: string) {
  const payload = await verifyIdToken(idToken);
  const sub = String(payload.sub);

  const user = await prisma.user.findUnique({
    where: { auth0Sub: sub },
    include: { adminSalon: true },
  });

  if (!user || user.role !== "admin") throw { status: 403, message: "Not allowed" };
  if (!user.adminSalon) throw { status: 400, message: "Create salon first" };

  return user.adminSalon;
}

// ─── Inventory Categories ───────────────────────────────────────────────────

// GET /api/inventory/categories
router.get("/categories", async (req, res) => {
  try {
    const { idToken } = req.query;
    if (!idToken) return res.status(401).json({ error: "Missing token" });

    const salon = await getAdminSalon(String(idToken));

    const categories = await prisma.inventoryCategory.findMany({
      where: { salonId: salon.id },
      include: { _count: { select: { items: true } } },
      orderBy: { name: "asc" },
    });

    res.json(categories);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message || "Failed" });
  }
});

// POST /api/inventory/categories
router.post("/categories", async (req, res) => {
  try {
    const { idToken, name, description } = req.body;
    if (!idToken) return res.status(401).json({ error: "Missing token" });

    const salon = await getAdminSalon(idToken);

    const category = await prisma.inventoryCategory.create({
      data: { name, description, salonId: salon.id },
    });

    res.json(category);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message || "Failed" });
  }
});

// PUT /api/inventory/categories/:id
router.put("/categories/:id", async (req, res) => {
  try {
    const { idToken, name, description } = req.body;
    if (!idToken) return res.status(401).json({ error: "Missing token" });

    const salon = await getAdminSalon(idToken);

    const existing = await prisma.inventoryCategory.findFirst({
      where: { id: req.params.id, salonId: salon.id },
    });
    if (!existing) return res.status(404).json({ error: "Not found" });

    const category = await prisma.inventoryCategory.update({
      where: { id: req.params.id },
      data: { name, description },
    });

    res.json(category);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message || "Failed" });
  }
});

// DELETE /api/inventory/categories/:id
router.delete("/categories/:id", async (req, res) => {
  try {
    const { idToken } = req.query;
    if (!idToken) return res.status(401).json({ error: "Missing token" });

    const salon = await getAdminSalon(String(idToken));

    const existing = await prisma.inventoryCategory.findFirst({
      where: { id: req.params.id, salonId: salon.id },
    });
    if (!existing) return res.status(404).json({ error: "Not found" });

    await prisma.inventoryCategory.delete({ where: { id: req.params.id } });

    res.json({ success: true });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message || "Failed" });
  }
});

// ─── Inventory Items ────────────────────────────────────────────────────────

// GET /api/inventory/items
router.get("/items", async (req, res) => {
  try {
    const { idToken } = req.query;
    if (!idToken) return res.status(401).json({ error: "Missing token" });

    const salon = await getAdminSalon(String(idToken));

    const items = await prisma.inventoryItem.findMany({
      where: { salonId: salon.id },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    res.json(items);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message || "Failed" });
  }
});

// POST /api/inventory/items
router.post("/items", async (req, res) => {
  try {
    const {
      idToken,
      name,
      description,
      categoryId,
      currentStock,
      minStock,
      unit,
      notes,
    } = req.body;

    if (!idToken) return res.status(401).json({ error: "Missing token" });

    const salon = await getAdminSalon(idToken);

    // Validate category belongs to salon
    if (categoryId) {
      const cat = await prisma.inventoryCategory.findFirst({
        where: { id: categoryId, salonId: salon.id },
      });
      if (!cat) return res.status(400).json({ error: "Invalid category" });
    }

    const item = await prisma.inventoryItem.create({
      data: {
        name,
        description,
        categoryId: categoryId || null,
        currentStock: Number(currentStock),
        minStock: Number(minStock),
        unit,
        notes,
        salonId: salon.id,
        lastRestocked: new Date(),
      },
      include: { category: true },
    });

    res.json(item);
  } catch (err: any) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || "Failed" });
  }
});

// PUT /api/inventory/items/:id
router.put("/items/:id", async (req, res) => {
  try {
    const {
      idToken,
      name,
      description,
      categoryId,
      currentStock,
      minStock,
      unit,
      notes,
    } = req.body;

    if (!idToken) return res.status(401).json({ error: "Missing token" });

    const salon = await getAdminSalon(idToken);

    const existing = await prisma.inventoryItem.findFirst({
      where: { id: req.params.id, salonId: salon.id },
    });
    if (!existing) return res.status(404).json({ error: "Not found" });

    const prevStock = existing.currentStock;
    const newStock = Number(currentStock);

    const item = await prisma.inventoryItem.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        categoryId: categoryId || null,
        currentStock: newStock,
        minStock: Number(minStock),
        unit,
        notes,
        // Update lastRestocked if stock was increased
        ...(newStock > prevStock ? { lastRestocked: new Date() } : {}),
      },
      include: { category: true },
    });

    res.json(item);
  } catch (err: any) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || "Failed" });
  }
});

// DELETE /api/inventory/items/:id
router.delete("/items/:id", async (req, res) => {
  try {
    const { idToken } = req.query;
    if (!idToken) return res.status(401).json({ error: "Missing token" });

    const salon = await getAdminSalon(String(idToken));

    const existing = await prisma.inventoryItem.findFirst({
      where: { id: req.params.id, salonId: salon.id },
    });
    if (!existing) return res.status(404).json({ error: "Not found" });

    await prisma.inventoryItem.delete({ where: { id: req.params.id } });

    res.json({ success: true });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message || "Failed" });
  }
});

export default router;