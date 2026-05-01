// facePhotos.ts
import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

router.get("/:userSub", async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { auth0Sub: req.params.userSub },
      include: { customerProfile: { include: { hairProfile: true } } },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.customerProfile) return res.status(400).json({ error: "Customer profile not found" });

    const photos = await prisma.userFacePhotos.findUnique({
      where: { customerId: user.customerProfile.id },
    });
    if (!photos) return res.status(404).json({ error: "No photos" });

    return res.json({
      ...photos,
      faceShape: user.customerProfile.hairProfile?.faceShape ?? null,
    });
  } catch (e) {
    res.status(500).json({ error: "Failed" });
  }
});

router.post("/:userSub", async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { auth0Sub: req.params.userSub },
      include: { customerProfile: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.customerProfile) return res.status(400).json({ error: "Customer profile not found" });

    const { frontPhoto, leftPhoto, rightPhoto } = req.body;

    const photos = await prisma.userFacePhotos.upsert({
      where: { customerId: user.customerProfile.id },
      create: {
        customerId: user.customerProfile.id,
        frontPhoto,
        leftPhoto,
        rightPhoto,
        generatedPhotos: {},
      },
      update: { frontPhoto, leftPhoto, rightPhoto, generatedPhotos: {} },
    });

    return res.json(photos);
  } catch (e) {
    res.status(500).json({ error: "Failed" });
  }
});

router.patch("/:userSub/generated", async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { auth0Sub: req.params.userSub },
      include: { customerProfile: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.customerProfile) return res.status(400).json({ error: "Customer profile not found" });

    const { styleId, views } = req.body;

    const existing = await prisma.userFacePhotos.findUnique({
      where: { customerId: user.customerProfile.id },
    });
    if (!existing) return res.status(404).json({ error: "No face photos found" });

    const generated = (existing.generatedPhotos as Record<string, any>) ?? {};
    generated[styleId] = views;

    await prisma.userFacePhotos.update({
      where: { customerId: user.customerProfile.id },
      data: { generatedPhotos: generated },
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error("PATCH generated error:", e);
    res.status(500).json({ error: "Failed" });
  }
});

export default router;