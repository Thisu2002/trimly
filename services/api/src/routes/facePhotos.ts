import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// GET — check if user has existing face photos
router.get("/:userSub", async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { auth0Sub: req.params.userSub },
      include: { hairProfile: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    const photos = await prisma.userFacePhotos.findUnique({
      where: { userId: user.id },
    });
    console.log("GET /face-photos result:", photos);
    if (!photos) return res.status(404).json({ error: "No photos" });

    return res.json({
      ...photos,
      faceShape: user.hairProfile?.faceShape ?? null,
    });
  } catch (e) {
    res.status(500).json({ error: "Failed" });
  }
});

// POST — save original 3 face photos (replaces any existing)
router.post("/:userSub", async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { auth0Sub: req.params.userSub },
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    const { frontPhoto, leftPhoto, rightPhoto } = req.body;

    const photos = await prisma.userFacePhotos.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        frontPhoto,
        leftPhoto,
        rightPhoto,
        generatedPhotos: {},
      },
      update: { frontPhoto, leftPhoto, rightPhoto, generatedPhotos: {} }, // reset generated on rescan
    });

    return res.json(photos);
  } catch (e) {
    res.status(500).json({ error: "Failed" });
  }
});

// PATCH — save a generated result for a styleId
// PATCH — save a generated result for a styleId
router.patch("/:userSub/generated", async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { auth0Sub: req.params.userSub },
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    const { styleId, views } = req.body;
    // views = { front: "data:...", left: "data:...", right: "data:..." }

    const existing = await prisma.userFacePhotos.findUnique({
      where: { userId: user.id },
    });
    if (!existing) return res.status(404).json({ error: "No face photos found" });

    const generated = (existing.generatedPhotos as Record<string, any>) ?? {};
    generated[styleId] = views; // overwrite all 3 views for this style at once

    await prisma.userFacePhotos.update({
      where: { userId: user.id },
      data: { generatedPhotos: generated },
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error("PATCH generated error:", e);
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
