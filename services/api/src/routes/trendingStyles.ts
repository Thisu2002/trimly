// D:\trimly\services\api\src\routes\trendingStyles.ts

import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

const TAGS = ["New", "Trending", "Popular", "Trending", "Popular", "New"];

// GET /api/trending-styles
router.get("/", async (req, res) => {
  try {
const limit = 4;

    const styles = await prisma.style.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const result = styles.map((style, index) => ({
      id:            style.id,
      name:          style.name,
      category:      style.category,
      description:   style.description,
      styleKey:       style.name,
      tag:           TAGS[index % TAGS.length],
    }));

    res.json({ styles: result });
  } catch (error) {
    console.error("[trending-styles]", error);
    res.status(500).json({ error: "Failed to fetch styles" });
  }
});

export default router;