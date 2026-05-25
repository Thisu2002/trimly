// D:\trimly\services\api\src\routes\salon.ts
import { Router } from "express";
import { prisma } from "../lib/prisma";
import { verifyIdToken } from "../lib/auth";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(__dirname, "../../uploads/salons");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

// POST /api/salon  (create)
router.post("/", upload.array("photos", 5), async (req, res) => {
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
    if (user.role !== "admin") return res.status(403).json({ error: "Not an admin" });
    if (user.adminSalon) return res.status(400).json({ error: "Salon already exists" });

    const apiBase = process.env.API_BASE_URL || "http://localhost:4000";
    const files = (req.files as Express.Multer.File[]) ?? [];
    const photoUrls = files.map((f) => `${apiBase}/uploads/salons/${f.filename}`);

    const salon = await prisma.salon.create({
      data: { name, phone, address, adminUserId: user.id, photos: photoUrls },
    });

    res.json(salon);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create salon" });
  }
});

// GET /api/salon/me  (fetch the admin's own salon)
router.get("/me", async (req, res) => {
  try {
    const idToken = req.query.idToken as string;
    if (!idToken) return res.status(401).json({ error: "Missing token" });

    const payload = await verifyIdToken(idToken);
    const sub = String(payload.sub);

    const user = await prisma.user.findUnique({
      where: { auth0Sub: sub },
      include: {
        adminSalon: true,
      },
    });

    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.adminSalon) return res.status(404).json({ error: "No salon found" });

    res.json(user.adminSalon);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch salon" });
  }
});

// PATCH /api/salon/me  (update name / phone / address / photos)
router.patch("/me", upload.array("newPhotos", 5), async (req, res) => {
  try {
    const { idToken, name, phone, address, keepPhotos } = req.body;
    if (!idToken) return res.status(401).json({ error: "Missing token" });

    const payload = await verifyIdToken(idToken);
    const sub = String(payload.sub);

    const user = await prisma.user.findUnique({
      where: { auth0Sub: sub },
      include: { adminSalon: true },
    });

    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role !== "admin") return res.status(403).json({ error: "Not an admin" });
    if (!user.adminSalon) return res.status(404).json({ error: "No salon found" });

    let kept: string[] = [];
    try {
      kept = keepPhotos ? JSON.parse(keepPhotos) : [];
    } catch {
      kept = [];
    }

    const existing = user.adminSalon.photos as string[];
    const removed = existing.filter((url) => !kept.includes(url));
    for (const url of removed) {
      const filename = url.split("/uploads/salons/")[1];
      if (filename) {
        const filePath = path.join(__dirname, "../../uploads/salons", filename);
        fs.unlink(filePath, () => {}); // best-effort
      }
    }

    const apiBase = process.env.API_BASE_URL || "http://localhost:4000";
    const newFiles = (req.files as Express.Multer.File[]) ?? [];
    const newUrls = newFiles.map((f) => `${apiBase}/uploads/salons/${f.filename}`);

    const photos = [...kept, ...newUrls].slice(0, 5);

    const salon = await prisma.salon.update({
      where: { id: user.adminSalon.id },
      data: { name, phone, address, photos },
    });

    res.json(salon);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update salon" });
  }
});

export default router;