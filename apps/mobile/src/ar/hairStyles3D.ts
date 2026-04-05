export interface HairStyle3D {
  id: string;
  name: string;
  category: "short" | "medium" | "long";
  gender: "female" | "male" | "unisex";
  suitableFaceShapes: string[];
  description: string;
  overlayShape: "top_cap" | "full_frame" | "long_frame" | "updo";
  lengthFrac: number;
  assetUri: any;
  asset: {
    offsetY: number;   // fraction of faceHeight — negative = move up
    offsetX: number;   // fraction of faceWidth  — negative = left
    widthScale: number;
    heightScale: number;
  };
}

export const HAIR_STYLES_3D: HairStyle3D[] = [

  // ── FEMALE ──────────────────────────────────────────────────────────────────

  {
    id: "pixie",
    name: "Pixie Cut",
    category: "short",
    gender: "female",
    suitableFaceShapes: ["oval", "heart", "diamond"],
    description: "Short & bold — frames the face beautifully.",
    overlayShape: "top_cap",
    lengthFrac: 0.08,
    assetUri: require("../../assets/hair/pixie.png"),
    asset: {
      offsetY: -0.35,
      offsetX: 0.15,
      widthScale: 2.8,
      heightScale: 1.5,
    },
  },
  {
    id: "bob",
    name: "Classic Bob",
    category: "short",
    gender: "female",
    suitableFaceShapes: ["oval", "square", "round"],
    description: "Timeless chin-length cut with clean lines.",
    overlayShape: "full_frame",
    lengthFrac: 0.95,
    assetUri: require("../../assets/hair/bob.png"),
    asset: {
      offsetY: -0.45,
      offsetX: 0.15,
      widthScale: 4.0,
      heightScale: 1.5,
    },
  },
  {
    id: "lob",
    name: "Long Bob (Lob)",
    category: "medium",
    gender: "female",
    suitableFaceShapes: ["oval", "round", "heart", "square"],
    description: "Versatile length — works with most face shapes.",
    overlayShape: "full_frame",
    lengthFrac: 1.15,
    assetUri: require("../../assets/hair/lob.png"),
    asset: {
      // lob PNG is angled — shift right to compensate tilt
      offsetY: -0.55,
      offsetX: 0.22,
      widthScale: 3.2,
      heightScale: 1.5,
    },
  },
  {
    id: "layers",
    name: "Long Layers",
    category: "long",
    gender: "female",
    suitableFaceShapes: ["oval", "square", "diamond", "oblong"],
    description: "Flowing layers with movement and volume.",
    overlayShape: "long_frame",
    lengthFrac: 1.6,
    assetUri: require("../../assets/hair/layers.png"),
    asset: {
      // Layers PNG is tall — hair crown is ~25% from top of image
      offsetY: -0.88,
      offsetX: 0.15,
      widthScale: 4.5,
      heightScale: 3.2,  // tall because hair goes well below chin
    },
  },
  {
    id: "curly_updo",
    name: "Curly Updo",
    category: "short",
    gender: "female",
    suitableFaceShapes: ["round", "square", "oblong"],
    description: "Voluminous curls swept up for a chic look.",
    overlayShape: "updo",
    lengthFrac: 0.15,
    assetUri: null,
    asset: { offsetY: -0.2, offsetX: 0, widthScale: 1.3, heightScale: 0.8 },
  },
  {
    id: "beachy_waves",
    name: "Beachy Waves",
    category: "long",
    gender: "female",
    suitableFaceShapes: ["oval", "heart", "oblong"],
    description: "Relaxed, textured waves for an effortless look.",
    overlayShape: "long_frame",
    lengthFrac: 1.8,
    assetUri: null,
    asset: { offsetY: -0.2, offsetX: 0, widthScale: 1.5, heightScale: 2.0 },
  },

  // ── MALE ────────────────────────────────────────────────────────────────────

  {
    id: "male_slickback",
    name: "Slick Back",
    category: "short",
    gender: "male",
    suitableFaceShapes: ["oval", "square", "oblong", "diamond"],
    description: "Clean, polished — swept back for a sharp look.",
    overlayShape: "top_cap",
    lengthFrac: 0.1,
    assetUri: require("../../assets/hair/male_cut.png"),
    asset: {
      // male_cut: pompadour, hair fills top ~60% of square image, centred
      offsetY: -0.5,
      offsetX: 0.0,
      widthScale: 2.0,
      heightScale: 1.1,
    },
  },
  {
    id: "male_swept",
    name: "Side Swept",
    category: "short",
    gender: "male",
    suitableFaceShapes: ["oval", "round", "heart"],
    description: "Effortlessly stylish side-swept look.",
    overlayShape: "top_cap",
    lengthFrac: 0.1,
    assetUri: require("../../assets/hair/male_cut2.png"),
    asset: {
      // male_cut2: side swept, hair heavy top-left — shift slightly right
      offsetY: -0.48,
      offsetX: 0.05,
      widthScale: 2.1,
      heightScale: 1.1,
    },
  },
  {
    id: "male_sidepart",
    name: "Classic Side Part",
    category: "short",
    gender: "male",
    suitableFaceShapes: ["oval", "square", "round", "oblong"],
    description: "Timeless and professional side parted style.",
    overlayShape: "top_cap",
    lengthFrac: 0.1,
    assetUri: require("../../assets/hair/male_cut3.png"),
    asset: {
      // male_cut3: compact, centred, fills top half of image
      offsetY: -0.45,
      offsetX: 0.0,
      widthScale: 2.0,
      heightScale: 1.0,
    },
  },
  {
    id: "male_voluminous",
    name: "Voluminous Sweep",
    category: "medium",
    gender: "male",
    suitableFaceShapes: ["oval", "diamond", "heart", "oblong"],
    description: "Bold and textured — full volume swept style.",
    overlayShape: "top_cap",
    lengthFrac: 0.12,
    assetUri: require("../../assets/hair/male_cut4.png"),
    asset: {
      // male_cut4: big voluminous top, centred, fills ~55% of image height
      offsetY: -0.52,
      offsetX: 0.0,
      widthScale: 1.8,
      heightScale: 1.2,
    },
  },
];

export function getStylesForFaceShape(faceShape: string): HairStyle3D[] {
  return HAIR_STYLES_3D.filter((s) =>
    s.suitableFaceShapes.includes(faceShape)
  );
}

export function getStylesForGender(gender: "male" | "female" | "unisex"): HairStyle3D[] {
  return HAIR_STYLES_3D.filter(
    (s) => s.gender === gender || s.gender === "unisex"
  );
}

export interface FaceBounds {
  faceTop:    number;
  faceLeft:   number;
  faceWidth:  number;
  faceHeight: number;
}

export function computeFaceBounds(
  landmarks: number[],
  displayW: number,
  displayH: number,
): FaceBounds {
  if (!landmarks || landmarks.length < 468 * 3) {
    return {
      faceTop:    displayH * 0.18,
      faceLeft:   displayW * 0.2,
      faceWidth:  displayW * 0.6,
      faceHeight: displayH * 0.65,
    };
  }

  const top   = { x: landmarks[10  * 3] * displayW, y: landmarks[10  * 3 + 1] * displayH };
  const chin  = { x: landmarks[152 * 3] * displayW, y: landmarks[152 * 3 + 1] * displayH };
  const left  = { x: landmarks[234 * 3] * displayW, y: landmarks[234 * 3 + 1] * displayH };
  const right = { x: landmarks[454 * 3] * displayW, y: landmarks[454 * 3 + 1] * displayH };

  return {
    faceTop:    top.y,
    faceLeft:   left.x,
    faceWidth:  right.x - left.x,
    faceHeight: chin.y  - top.y,
  };
}

export function buildHairPath(
  landmarks: number[],
  style: HairStyle3D,
  displayW: number,
  displayH: number,
): string {
  if (!landmarks || landmarks.length < 468 * 3) {
    const cx = displayW / 2;
    return `M ${displayW*0.15} ${displayH*0.35} Q ${cx} ${displayH*0.1} ${displayW*0.85} ${displayH*0.35} Q ${cx} ${displayH*0.4} ${displayW*0.15} ${displayH*0.35} Z`;
  }

  function lm(idx: number) {
    return {
      x: landmarks[idx * 3]     * displayW,
      y: landmarks[idx * 3 + 1] * displayH,
    };
  }

  const top    = lm(10);
  const chin   = lm(152);
  const left   = lm(234);
  const right  = lm(454);
  const tLeft  = lm(127);
  const tRight = lm(356);

  const faceH = chin.y - top.y;
  const faceW = right.x - left.x;
  const cx    = (left.x + right.x) / 2;

  const hairTop    = top.y  - faceH * 0.18;
  const hairBottom = top.y  + faceH * style.lengthFrac;
  const hairLeft   = left.x - faceW * 0.12;
  const hairRight  = right.x + faceW * 0.12;

  switch (style.overlayShape) {
    case "top_cap":
      return [
        `M ${hairLeft} ${top.y + faceH * 0.05}`,
        `Q ${tLeft.x} ${hairTop - faceH * 0.05} ${cx} ${hairTop}`,
        `Q ${tRight.x} ${hairTop - faceH * 0.05} ${hairRight} ${top.y + faceH * 0.05}`,
        `Q ${cx} ${top.y + faceH * 0.12} ${hairLeft} ${top.y + faceH * 0.05}`,
        "Z",
      ].join(" ");
    case "updo":
      return [
        `M ${hairLeft + faceW * 0.1} ${top.y}`,
        `Q ${cx} ${hairTop - faceH * 0.2} ${hairRight - faceW * 0.1} ${top.y}`,
        `Q ${hairRight} ${top.y + faceH * 0.1} ${hairRight - faceW * 0.1} ${top.y + faceH * 0.15}`,
        `Q ${cx} ${top.y + faceH * 0.12} ${hairLeft + faceW * 0.1} ${top.y + faceH * 0.15}`,
        `Q ${hairLeft} ${top.y + faceH * 0.1} ${hairLeft + faceW * 0.1} ${top.y}`,
        "Z",
      ].join(" ");
    case "full_frame":
      return [
        `M ${hairLeft} ${hairBottom}`,
        `L ${hairLeft} ${top.y + faceH * 0.1}`,
        `Q ${tLeft.x} ${hairTop} ${cx} ${hairTop}`,
        `Q ${tRight.x} ${hairTop} ${hairRight} ${top.y + faceH * 0.1}`,
        `L ${hairRight} ${hairBottom}`,
        `Q ${cx} ${hairBottom - faceH * 0.05} ${hairLeft} ${hairBottom}`,
        "Z",
      ].join(" ");
    case "long_frame":
    default:
      return [
        `M ${hairLeft} ${hairBottom}`,
        `Q ${hairLeft - faceW * 0.05} ${chin.y} ${hairLeft} ${top.y + faceH * 0.15}`,
        `Q ${tLeft.x} ${hairTop} ${cx} ${hairTop}`,
        `Q ${tRight.x} ${hairTop} ${hairRight} ${top.y + faceH * 0.15}`,
        `Q ${hairRight + faceW * 0.05} ${chin.y} ${hairRight} ${hairBottom}`,
        `Q ${cx} ${hairBottom + faceH * 0.05} ${hairLeft} ${hairBottom}`,
        "Z",
      ].join(" ");
  }
}