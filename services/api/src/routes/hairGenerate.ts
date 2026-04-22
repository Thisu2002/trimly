import { Router } from "express";
import sharp from "sharp";

const router = Router();

//CLAID.AI
import FormData from "form-data";


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

import axios from "axios";

router.post("/generate", async (req: any, res) => {
  try {
    const { photoBase64, styleId } = req.body;  // ← removed view
    if (!photoBase64) return res.status(400).json({ error: "Missing image" });

    const rawBase64 = photoBase64.includes(",")
      ? photoBase64.split(",")[1]
      : photoBase64;

    const processed = await sharp(Buffer.from(rawBase64, "base64"))
      .rotate()
      .resize(1024, 1024, { fit: "cover" })
      .jpeg({ quality: 90 })
      .toBuffer();

    // Upload
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
    if (!imageUrl) throw new Error(`No image URL from Claid upload. Response: ${JSON.stringify(uploadRes.data)}`);
    console.log("✅ Claid upload success:", imageUrl);

    // AI Edit — add per-request delay based on a timestamp header
    // to stagger concurrent calls from the frontend
    const requestIndex = parseInt(req.headers["x-request-index"] ?? "0", 10);
    if (requestIndex > 0) {
      await new Promise((r) => setTimeout(r, requestIndex * 1200)); // 0ms, 1.2s, 2.4s
    }

    const prompt = STYLE_PROMPTS[styleId] ?? "Change the hairstyle to a natural style. Keep the face identical.";

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
    if (!resultUrl) throw new Error(`No result_url from Claid. Response: ${JSON.stringify(aiEditRes.data)}`);
    console.log("✅ Claid AI edit accepted, polling:", resultUrl);

    const finalImageUrl = await pollClaidResult(resultUrl);

    const imgBuffer = await axios.get(finalImageUrl, { responseType: "arraybuffer" });
    return res.json({
      imageUrl: `data:image/png;base64,${Buffer.from(imgBuffer.data).toString("base64")}`,
    });

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

    // Log full response on first DONE so we can see the exact shape
    if (status === "DONE" && i === 1) {
      console.log("Claid DONE response:", JSON.stringify(data, null, 2));
    }

    if (status === "DONE") {
  const url = data?.result?.output_objects?.[0]?.tmp_url;

  if (url) return url;
  throw new Error(`DONE but couldn't find image URL. Full data: ${JSON.stringify(data)}`);
}

    if (status === "FAILED" || status === "failed") {
      throw new Error(`Claid generation failed: ${JSON.stringify(data)}`);
    }
  }

  throw new Error("Claid polling timed out");
}
//CLOUDFLARE WIHTOUT MASK
// router.post("/generate", async (req: any, res) => {
//   try {
//     console.log("🔥 /generate hit");

//     const { photoBase64, styleId, view } = req.body;

//     if (!photoBase64) {
//       return res.status(400).json({ error: "Missing image" });
//     }

//     // Strip data URL prefix if present (e.g. "data:image/jpeg;base64,...")
//     const rawBase64 = photoBase64.includes(",")
//       ? photoBase64.split(",")[1]
//       : photoBase64;

//     // Fix rotation + resize to exactly 512x512 JPEG — model requires this
//     const processed = await sharp(Buffer.from(rawBase64, "base64"))
//       .rotate()                              // fix EXIF orientation
//       .resize(512, 512, { fit: "cover" })
//       .jpeg({ quality: 85 })
//       .toBuffer();

//     const cleanBase64 = processed.toString("base64");

//     const cfRes = await fetch("https://trimly-ai-worker.trimly-ai-worker.workers.dev", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         photoBase64: cleanBase64,  // clean, no prefix, 512x512 JPEG
//         styleId,
//         view,
//       }),
//     });

//     console.log("Worker status:", cfRes.status);

//     if (!cfRes.ok) {
//       const text = await cfRes.text();
//       console.error("❌ Worker error:", text);
//       return res.status(500).json({ error: text });
//     }

//     const buffer = await cfRes.arrayBuffer();
//     return res.json({
//       imageUrl: `data:image/png;base64,${Buffer.from(buffer).toString("base64")}`,
//     });

//   } catch (err) {
//     console.error("🔥 SERVER ERROR:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

//CLOUDFLARE WITH MASK
// router.post("/generate", async (req: any, res) => {
//   try {
//     const { photoBase64, styleId, view } = req.body;
//     if (!photoBase64) return res.status(400).json({ error: "Missing image" });

//     const rawBase64 = photoBase64.includes(",")
//       ? photoBase64.split(",")[1]
//       : photoBase64;

//     // 1. Process image to exactly 512x512
//     const processed = await sharp(Buffer.from(rawBase64, "base64"))
//       .rotate()
//       .resize(512, 512, { fit: "cover" })
//       .png()
//       .toBuffer();

//     // 2. Generate hair mask — white on top ~40% of image, black everywhere else
//     //    This covers the hair region for most portrait orientations.
//     //    Top 40% = rows 0–204 of 512px image
//     const hairMask = await generateHairMask(512, 512);

//     const cleanBase64 = processed.toString("base64");
//     const maskBase64  = hairMask.toString("base64");

//     const cfRes = await fetch("https://trimly-ai-worker.trimly-ai-worker.workers.dev", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         photoBase64: cleanBase64,
//         maskBase64,
//         styleId,
//         view,
//       }),
//     });

//     if (!cfRes.ok) {
//       const text = await cfRes.text();
//       return res.status(500).json({ error: text });
//     }

//     const buffer = await cfRes.arrayBuffer();
//     return res.json({
//       imageUrl: `data:image/png;base64,${Buffer.from(buffer).toString("base64")}`,
//     });

//   } catch (err) {
//     console.error("🔥 SERVER ERROR:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });


// async function generateHairMask(width: number, height: number): Promise<Buffer> {
//   const hairRegionEnd = Math.floor(height * 0.45);   // row 230 of 512
//   const featherZone   = Math.floor(height * 0.08);   // 40px soft edge

//   // Build raw grayscale pixel data
//   const pixels = Buffer.alloc(width * height);

//   for (let y = 0; y < height; y++) {
//     let value: number;

//     if (y < hairRegionEnd - featherZone) {
//       value = 255;
//     } else if (y < hairRegionEnd) {
//       const t = (y - (hairRegionEnd - featherZone)) / featherZone;
//       value = Math.round(255 * (1 - t));
//     } else {
//       value = 0;
//     }

//     pixels.fill(value, y * width, y * width + width);
//   }

//   return sharp(pixels, {
//     raw: { width, height, channels: 1 },
//   })
//     .png()
//     .toBuffer();
// }


//REPLICATE
// router.post("/generate", async (req: any, res) => {
//   try {
//     const { photoBase64, styleId, view } = req.body;
//     // view: "front" | "left" | "right"

//     const stylePrompt = STYLE_PROMPTS[styleId] ?? "natural hairstyle";
//     const viewPrompt  =
//       view === "left"  ? "face turned left, side profile" :
//       view === "right" ? "face turned right, side profile" :
//       "facing forward, front view";

//     const prompt = `${stylePrompt}, ${viewPrompt}, same person, preserve facial identity, do not change face, realistic hair, professional salon hairstyle, high quality portrait`;
//     const negativePrompt = "deformed, blurry, bad anatomy, ugly, watermark";

//     // Call Replicate
//     const startRes = await fetch("https://api.replicate.com/v1/predictions", {
//       method: "POST",
//       headers: {
//         "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         // SDXL inpainting — good quality, fast
//         version: "stability-ai/sdxl-img2img",
//         input: {
//           prompt,
//           negative_prompt: negativePrompt,
//           image: `data:image/jpeg;base64,${photoBase64}`,
//           num_inference_steps: 30,
//           guidance_scale: 7.5,
//           strength: 0.65, // how much to change — 0=nothing, 1=completely new
//         },
//       }),
//     });

//     const prediction = await startRes.json() as any;

//     // Poll until done (Replicate is async)
//     let result = prediction;
//     while (result.status !== "succeeded" && result.status !== "failed") {
//       await new Promise((r) => setTimeout(r, 1500));
//       const pollRes = await fetch(
//         `https://api.replicate.com/v1/predictions/${result.id}`,
//         { headers: { "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}` } }
//       );
//       result = await pollRes.json();
//     }

//     if (result.status === "failed") {
//       return res.status(500).json({ error: "Generation failed" });
//     }

//     return res.json({ imageUrl: result.output[0] });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

export default router;