// services/api/src/lib/generateHairMask.ts
import { createCanvas } from "canvas"; // npm install canvas

export function generateHairMask(
  landmarks: number[],
  photoWidth: number,
  photoHeight: number,
): string {
  const canvas = createCanvas(photoWidth, photoHeight);
  const ctx    = canvas.getContext("2d");

  // Fill black (keep everything)
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, photoWidth, photoHeight);

  if (!landmarks || landmarks.length < 468 * 3) {
    // Fallback: mask top 40% of image as hair region
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, photoWidth, photoHeight * 0.4);
    return canvas.toDataURL("image/png").split(",")[1];
  }

  function lm(idx: number) {
    return {
      x: landmarks[idx * 3]     * photoWidth,
      y: landmarks[idx * 3 + 1] * photoHeight,
    };
  }

  const foreheadTop = lm(10);
  const chin        = lm(152);
  const leftCheek   = lm(234);
  const rightCheek  = lm(454);
  const leftTemple  = lm(127);
  const rightTemple = lm(356);

  const faceH    = chin.y  - foreheadTop.y;
  const faceW    = rightCheek.x - leftCheek.x;
  const centrX   = (leftCheek.x + rightCheek.x) / 2;

  // Hair region = everything above forehead + sides above ears
  // Draw as a white filled polygon
  ctx.fillStyle = "white";
  ctx.beginPath();

  // Start bottom-left (at temple level)
  ctx.moveTo(leftTemple.x  - faceW * 0.15, foreheadTop.y + faceH * 0.05);
  // Up to top-left corner of head
  ctx.lineTo(leftTemple.x  - faceW * 0.2,  foreheadTop.y - faceH * 0.05);
  // Crown of head
  ctx.quadraticCurveTo(centrX, foreheadTop.y - faceH * 0.35, rightTemple.x + faceW * 0.2, foreheadTop.y - faceH * 0.05);
  // Down to right temple
  ctx.lineTo(rightTemple.x + faceW * 0.15, foreheadTop.y + faceH * 0.05);
  // Back across the forehead (bottom of mask)
  ctx.quadraticCurveTo(centrX, foreheadTop.y + faceH * 0.08, leftTemple.x - faceW * 0.15, foreheadTop.y + faceH * 0.05);

  ctx.closePath();
  ctx.fill();

  // Soften the mask edges with blur so it blends naturally
  // (canvas doesn't have blur, but we can expand the mask slightly
  //  and rely on inpainting model's natural blending)

  return canvas.toDataURL("image/png").split(",")[1];
}