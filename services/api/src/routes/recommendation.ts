import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

router.post("/style", async (req, res) => {
  try {
    const {
      faceShape,
      hairType,
      hairLength,
      styleGoal,
      previousServices,
    } = req.body;

    const aiRes = await fetch("http://localhost:8000/recommendations/style", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        faceShape,
        hairType,
        hairLength,
        styleGoal,
        previousServices: previousServices ?? [],
      }),
    });

    const aiData = await aiRes.json();

    const styleNames = aiData.recommendations.flatMap(
      (r: any) => r.recommendedStyles,
    );

    const styles = await prisma.style.findMany({
      where: { name: { in: styleNames } },
    });

    const styleIds = styles.map((s) => s.id);

    let services = [];
    services = await prisma.service.findMany({
      where: {
        styleId: { in: styleIds },
      },
      include: { category: true },
    });

    return res.json({
      ai: aiData,
      matchedServices: services,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Recommendation failed" });
  }
});

export default router;
