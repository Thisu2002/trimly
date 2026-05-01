// D:\trimly\apps\mobile\src\lib\tierColors.ts
//
// Mirrors web's tierColors.ts exactly — same index order, same color intent,
// translated from Tailwind classes to raw hex values for React Native.
//
// Index → Tier mapping (matches web):
//   0 — Bronze   🥉  orange
//   1 — Silver   🥈  slate
//   2 — Gold     🥇  dark-olive → gold  (#373005 → #d4af37)
//   3 — Platinum 💎  purple → blue
//   4 — Teal     🔮  teal → emerald
//   5 — Rose     ⚡  rose → pink
//   6 — Cyan     🌟  cyan → sky

export interface MobileTierColor {
  icon: string;
  gradientColors: [string, string]; // for expo-linear-gradient
  textColor: string;                // primary text / accent color for this tier
  badgeBg: string;                  // semi-transparent bg for tier badge chip
  glowColor: string;                // glow / shadow tint on hero card
}

const TIER_COLORS: MobileTierColor[] = [
  // 0 — Bronze  (orange-800 → orange-600)
  {
    icon: "🥉",
    gradientColors: ["#92400e", "#c2410c"],
    textColor: "#fb923c",
    badgeBg: "rgba(146, 64, 14, 0.3)",
    glowColor: "rgba(194, 65, 12, 0.4)",
  },
  // 1 — Silver  (slate-500 → slate-400)
  {
    icon: "🥈",
    gradientColors: ["#6b7280", "#9ca3af"],
    textColor: "#d1d5db",
    badgeBg: "rgba(107, 114, 128, 0.3)",
    glowColor: "rgba(156, 163, 175, 0.35)",
  },
  // 2 — Gold  (#373005 → #d4af37)  matches web exactly
  {
    icon: "🥇",
    gradientColors: ["#373005", "#d4af37"],
    textColor: "#d4af37",
    badgeBg: "rgba(55, 48, 5, 0.45)",
    glowColor: "rgba(212, 175, 55, 0.4)",
  },
  // 3 — Platinum  (purple-700 → blue-400)
  {
    icon: "💎",
    gradientColors: ["#6d28d9", "#60a5fa"],
    textColor: "#c4b5fd",
    badgeBg: "rgba(109, 40, 217, 0.3)",
    glowColor: "rgba(96, 165, 250, 0.4)",
  },
  // 4 — Teal  (teal-700 → emerald-400)
  {
    icon: "🔮",
    gradientColors: ["#0f766e", "#34d399"],
    textColor: "#34d399",
    badgeBg: "rgba(15, 118, 110, 0.3)",
    glowColor: "rgba(52, 211, 153, 0.4)",
  },
  // 5 — Rose  (rose-700 → pink-400)
  {
    icon: "⚡",
    gradientColors: ["#be123c", "#f472b6"],
    textColor: "#fb7185",
    badgeBg: "rgba(190, 18, 60, 0.3)",
    glowColor: "rgba(244, 114, 182, 0.4)",
  },
  // 6 — Cyan  (cyan-700 → sky-400)
  {
    icon: "🌟",
    gradientColors: ["#0e7490", "#38bdf8"],
    textColor: "#67e8f9",
    badgeBg: "rgba(14, 116, 144, 0.3)",
    glowColor: "rgba(56, 189, 248, 0.4)",
  },
];

export function getTierColor(sortOrder: number): MobileTierColor {
  return TIER_COLORS[sortOrder % TIER_COLORS.length];
}