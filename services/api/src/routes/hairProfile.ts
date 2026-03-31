import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

router.get("/:userSub", async (req: any, res) => {
  try {
    const { userSub } = req.params;

    if (!userSub) return res.status(401).json({ error: "Missing user" });

    const user = await prisma.user.findUnique({
      where: { auth0Sub: userSub },
      include: { customerProfile: true },
    });

    if (!user?.customerProfile) {
      return res.status(400).json({ error: "Customer profile not found" });
    }

    const profile = await prisma.userHairProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      return res.status(404).json({ error: "No hair profile found" });
    }

    return res.json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch hair profile" });
  }
});

router.put("/:userSub", async (req: any, res) => {
  try {
    const { userSub } = req.params;

    if (!userSub) return res.status(401).json({ error: "Missing user" });

    const user = await prisma.user.findUnique({
      where: { auth0Sub: userSub },
      include: { customerProfile: true },
    });

    if (!user?.customerProfile) {
      return res.status(400).json({ error: "Customer profile not found" });
    }

    const {
      faceShape,
      hairType,
      hairLength,
      styleGoal,
      previousServices,
      detectionMethod,
    } = req.body;

    const profile = await prisma.userHairProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        faceShape,
        hairType,
        hairLength,
        styleGoal,
        previousServices: previousServices ?? [],
        detectionMethod: detectionMethod ?? "manual",
      },
      update: {
        ...(faceShape && { faceShape }),
        ...(hairType && { hairType }),
        ...(hairLength && { hairLength }),
        ...(styleGoal && { styleGoal }),
        ...(previousServices && { previousServices }),
        ...(detectionMethod && { detectionMethod }),
      },
    });

    return res.json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save hair profile" });
  }
});

export default router;