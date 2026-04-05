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

    const aiRes = await fetch(process.env.AI_URL + "/recommendations/style", {
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

    const styleNames: string[] = aiData.recommendations.flatMap(
      (r: any) => r.recommendedStyles as string[],
    );

    const styles = await prisma.style.findMany({
      where: {
        name: {
          in: styleNames,
          mode: "insensitive",
        },
      },
    });

    const styleIds = styles.map((s) => s.id);

    const services = await prisma.service.findMany({
      where: {
        styleId: { in: styleIds },
      },
      include: {
        category: {
          select: { name: true },
        },
        salon: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },
        style: {
          select: { name: true },
        },
      },
    });

    const servicesByStyle: Record<string, typeof services> = {};
    for (const svc of services) {
      const styleName = svc.style?.name ?? "Unknown";
      if (!servicesByStyle[styleName]) servicesByStyle[styleName] = [];
      servicesByStyle[styleName].push(svc);
    }

    return res.json({
      ai: aiData,
      matchedServices: services,
      servicesByStyle,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Recommendation failed" });
  }
});

export default router;