/**
 * GET /api/trending-styles
 */

import { Router, Request } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Turns a local asset path like "/assets/pic5.jpg" into a full URL
 * like "http://192.168.1.42:4000/assets/pic5.jpg" so React Native
 * can actually load it. External https:// URLs are returned unchanged.
 */
function toAbsoluteUrl(path: string, req: Request): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  // req.protocol + host gives us e.g. "http://192.168.1.42:4000"
  const base = `${req.protocol}://${req.get("host")}`;
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

// ─── Image map ────────────────────────────────────────────────────────────────
// Values can be:
//   • A full https:// Unsplash URL
//   • A local path like "/assets/pic5.jpg"  ← will be made absolute at runtime
const STYLE_NAME_IMAGES: Record<string, string> = {
  "Layered Bob":       "/assets/pic4.jpg",
  "Textured Lob":      "/assets/pic4.jpg",
  "Crew Cut":          "/assets/pic6.jpg",
  "Pixie Cut":         "/assets/pic6.jpg",
  "Balayage":          "/assets/pic4.jpg",
  "Highlights":        "/assets/pic2.jpg",
  "Keratin Treatment": "/assets/pic6.jpg",
  "Hair Spa":          "/assets/pic4.jpg",
  "Blow Dry":          "/assets/pic5.jpg",
  "Deep Conditioning": "/assets/pic7.jpg",   // ← local, made absolute below
};

const CATEGORY_IMAGES: Record<string, string> = {
  haircut:   "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&q=80",
  color:     "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=400&q=80",
  treatment: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&q=80",
  styling:   "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&q=80",
  default:   "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80",
};

function getCoverImagePath(style: {
  coverImageUrl?: string | null;
  name: string;
  category: string;
}): string {
  if (style.coverImageUrl) return style.coverImageUrl;
  if (STYLE_NAME_IMAGES[style.name]) return STYLE_NAME_IMAGES[style.name];
  const cat = style.category?.toLowerCase() ?? "";
  return CATEGORY_IMAGES[cat] ?? CATEGORY_IMAGES.default;
}

const TAGS = ["New", "Trending", "Popular", "Trending", "Popular", "New"];

// ─── GET /api/trending-styles ─────────────────────────────────────────────────
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
      // Convert any local "/assets/..." path → full "http://host:4000/assets/..."
      coverImageUrl: toAbsoluteUrl(getCoverImagePath(style as any), req),
      tag:           TAGS[index % TAGS.length],
    }));

    res.json({ styles: result });
  } catch (error) {
    console.error("[trending-styles]", error);
    res.status(500).json({ error: "Failed to fetch styles" });
  }
});

export default router;