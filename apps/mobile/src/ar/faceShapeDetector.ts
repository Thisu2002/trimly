/**
 * faceShapeDetector.ts
 * Given 468 MediaPipe face-mesh landmark points (normalised 0-1),
 * returns one of the 6 canonical face shapes.
 *
 * Landmark indices reference:
 * https://github.com/google/mediapipe/blob/master/mediapipe/modules/face_geometry/data/canonical_face_model_uv_visualization.png
 */

export type FaceShape =
  | "oval"
  | "round"
  | "square"
  | "heart"
  | "diamond"
  | "oblong";

export interface Landmark {
  x: number; // 0-1 normalised
  y: number;
  z: number;
}

// Key landmark indices (MediaPipe 468-point model)
const IDX = {
  foreheadTop: 10,
  chin: 152,
  leftCheek: 234,
  rightCheek: 454,
  leftTemple: 127,
  rightTemple: 356,
  leftJaw: 172,
  rightJaw: 397,
  leftCheekbone: 116,
  rightCheekbone: 345,
} as const;

function dist(a: Landmark, b: Landmark): number {
  return Math.sqrt(
    (a.x - b.x) ** 2 +
    (a.y - b.y) ** 2
  );
}

export function detectFaceShape(landmarks: Landmark[]): FaceShape {
  if (landmarks.length < 468) return "oval"; // fallback

  const faceHeight   = dist(landmarks[IDX.foreheadTop], landmarks[IDX.chin]);
  const faceWidth    = dist(landmarks[IDX.leftCheek],   landmarks[IDX.rightCheek]);
  const foreheadWidth = dist(landmarks[IDX.leftTemple], landmarks[IDX.rightTemple]);
  const jawWidth     = dist(landmarks[IDX.leftJaw],     landmarks[IDX.rightJaw]);
  const cheekWidth   = dist(landmarks[IDX.leftCheekbone], landmarks[IDX.rightCheekbone]);

  const ratio        = faceHeight / faceWidth;      // > 1 = longer than wide
  const foreheadRatio = foreheadWidth / faceWidth;  // how wide is forehead vs cheeks
  const jawRatio     = jawWidth / faceWidth;         // how wide is jaw vs cheeks

  // Classification logic (empirically tuned thresholds)
  if (ratio > 1.5)                                  return "oblong";
  if (ratio > 1.25 && jawRatio < 0.75)              return "heart";
  if (jawRatio > 0.9 && ratio < 1.15)               return "square";
  if (ratio < 1.1 && jawRatio > 0.8)                return "round";
  if (foreheadRatio < 0.80 && jawRatio < 0.75 && cheekWidth / faceWidth > 0.95)
                                                     return "diamond";
  return "oval"; // default / most common
}