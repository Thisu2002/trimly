import { Router } from "express";
import sharp from "sharp";
import FormData from "form-data";
import axios from "axios";

const router = Router();

const STYLE_PROMPTS: Record<string, string> = {
  pixie:           "Change the hairstyle to a pixie cut: very short, cropped, tapered nape, textured top. Keep the face, skin, and everything else identical.",
  bob:             "Change the hairstyle to a blunt chin-length bob: sleek, straight, no layers. Keep the face, skin, and everything else identical.",
  lob:             "Change the hairstyle to a long bob at collarbone length: smooth, straight. Keep the face, skin, and everything else identical.",
  layers:          "Change the hairstyle to long layered hair with flowing waves and face-framing layers. Keep the face, skin, and everything else identical.",
  male_slickback:  "Change the hairstyle to a mens slicked-back style: short sides, hair swept back. Keep the face, skin, and everything else identical.",
  male_swept:      "Change the hairstyle to a mens side-swept style: soft side part, casual loose look. Keep the face, skin, and everything else identical.",
  male_sidepart:   "Change the hairstyle to a mens hard side part: short back and sides, combed over. Keep the face, skin, and everything else identical.",
  male_voluminous: "Change the hairstyle to a mens voluminous quiff: lifted at the front, textured finish. Keep the face, skin, and everything else identical.",
};

router.post("/generate-all", async (req: any, res) => {
  try {
    console.log("🔥 /generate-all hit");
    const { photos, styleId } = req.body as {
      photos: { front: string; left: string; right: string };
      styleId: string;
    };

    if (!photos?.front || !photos?.left || !photos?.right) {
      return res.status(400).json({ error: "Missing photos" });
    }

    const prompt = STYLE_PROMPTS[styleId] ?? "Change the hairstyle to a natural style. Keep the face identical.";
    const results: Record<string, string> = {};

    for (const view of ["front", "left", "right"] as const) {
      console.log(`⏳ Processing ${view}...`);

      const rawBase64 = photos[view].includes(",")
        ? photos[view].split(",")[1]
        : photos[view];

      const processed = await sharp(Buffer.from(rawBase64, "base64"))
        .rotate()
        .resize(1024, 1024, { fit: "cover" })
        .jpeg({ quality: 90 })
        .toBuffer();

      const uploadForm = new FormData();
      uploadForm.append("file", processed, {
        filename: "photo",
        contentType: "image/jpeg",
      });
      uploadForm.append(
        "data",
        JSON.stringify({ operations: {}, output: { format: "jpeg" } })
      );

      const uploadRes = await axios.post(
        "https://api.claid.ai/v1/image/edit/upload",
        uploadForm,
        {
          headers: {
            Authorization: `Bearer ${process.env.CLAID_API_KEY}`,
            ...uploadForm.getHeaders(),
          },
        }
      );

      const imageUrl: string = uploadRes.data?.data?.output?.tmp_url;
      if (!imageUrl) throw new Error(`No upload URL for ${view}`);
      console.log(`✅ Uploaded ${view}:`, imageUrl);

      const aiEditRes = await axios.post(
        "https://api.claid.ai/v1/image/ai-edit",
        {
          input: imageUrl,
          options: { model: "v2", prompt },
          output: { format: "png", number_of_images: 1 },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.CLAID_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const resultUrl: string = aiEditRes.data?.data?.result_url;
      if (!resultUrl) throw new Error(`No result_url for ${view}`);
      console.log(`✅ AI edit accepted for ${view}, polling...`);

      const finalImageUrl = await pollClaidResult(resultUrl);

      const imgBuffer = await axios.get(finalImageUrl, { responseType: "arraybuffer" });
      results[view] = `data:image/png;base64,${Buffer.from(imgBuffer.data).toString("base64")}`;
      console.log(`✅ Done ${view}`);

      if (view !== "right") {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    return res.json({ front: results.front, left: results.left, right: results.right });

  } catch (err: any) {
    const detail = err?.response?.data ?? err.message;
    console.error("🔥 SERVER ERROR:", detail);
    res.status(500).json({ error: typeof detail === "string" ? detail : JSON.stringify(detail) });
  }
});

async function pollClaidResult(
  resultUrl: string,
  maxAttempts = 30,
  intervalMs = 3000
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));

    const statusRes = await axios.get(resultUrl, {
      headers: { Authorization: `Bearer ${process.env.CLAID_API_KEY}` },
    });

    const data = statusRes.data?.data;
    const status: string = data?.status;
    console.log(`Claid poll ${i + 1}: ${status}`);

    if (status === "DONE") {
      const url = data?.result?.output_objects?.[0]?.tmp_url;
      if (url) return url;
      throw new Error(`DONE but no URL. Full data: ${JSON.stringify(data)}`);
    }

    if (status === "FAILED" || status === "failed") {
      throw new Error(`Claid generation failed: ${JSON.stringify(data)}`);
    }
  }

  throw new Error("Claid polling timed out");
}

export default router;