import { Router } from "express";

const router = Router();

router.post("/style", async (req, res) => {
  try {
    const { faceShape, hairType, hairLength, styleGoal, previousServices } = req.body;

    if (!faceShape || !hairType || !hairLength || !styleGoal) {
      return res.status(400).json({
        error: "faceShape, hairType, hairLength, and styleGoal are required",
      });
    }

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

    if (!aiRes.ok) {
      const errorText = await aiRes.text();
      console.error("AI service error:", errorText);
      return res.status(502).json({ error: "AI service failed" });
    }

    const data = await aiRes.json();
    return res.json(data);
  } catch (error) {
    console.error("Recommendation route error:", error);
    return res.status(500).json({ error: "Failed to fetch recommendations" });
  }
});

export default router;