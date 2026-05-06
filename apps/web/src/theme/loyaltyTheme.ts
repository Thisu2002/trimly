/**
 * loyaltyTheme.ts
 * ─────────────────────────────────────────────────────────────
 * Single source of truth for the Loyalty admin palette.
 *
 * Primary accent : #abd5ff  (soft sky-blue)
 * Surface dark   : #111827  (card bg)
 * Surface darker : #0f172a  (inner card bg)
 * Border default : gray-700
 *
 * Usage example:
 *   import { lTheme, tierColors } from "@/theme/loyaltyTheme";
 *   <Award className={lTheme.iconAccent} />
 *   <span className={tierColors[0].textColor}>Bronze</span>
 */

// ── Shared tokens ─────────────────────────────────────────────
export const lTheme = {
  /** #abd5ff — primary accent color for icons, borders, text highlights */
  accent: "#abd5ff",

  // Tailwind class shorthands (use where inline style isn't needed)
  iconAccent:        "text-[#abd5ff]",
  textAccent:        "text-[#abd5ff]",
  borderAccentHover: "hover:border-[#abd5ff]/40",
  borderAccentFocus: "focus:border-[#abd5ff]",
  badgeBg:           "bg-[#abd5ff]/10",
  badgeBorder:       "border-[#abd5ff]/30",
  badgeText:         "text-[#abd5ff]",

  /** Card surfaces */
  cardBg:      "bg-[#111827]",
  innerCardBg: "bg-[#0f172a]",

  /** Gradient border trick — wrap the element in this div */
  gradientBorderWrap: "p-[1px] rounded-full bg-gradient-to-r",
  gradientBorderInner: "rounded-full bg-[#0f172a] px-2 py-0.5 text-xs text-white",
} as const;

// ── Per-tier color config ──────────────────────────────────────
export interface TierColorConfig {
  /** emoji icon */
  icon: string;
  /** Tailwind text colour for the tier name */
  textColor: string;
  /** Tailwind gradient classes for the threshold badge and card hover border */
  gradient: string;
  /** Tailwind hover:border class — uses the tier accent */
  borderAccent: string;
  /** Raw hex for inline style when Tailwind can't handle dynamic gradients */
  gradientFrom: string;
  gradientTo: string;
}

export const tierColors: TierColorConfig[] = [
  {
    // 0 — Bronze
    icon: "🥉",
    textColor: "text-orange-400",
    gradient: "from-orange-700 to-orange-500",
    borderAccent: "hover:border-orange-500/40",
    gradientFrom: "#9a3412",
    gradientTo: "#f97316",
  },
  {
    // 1 — Silver
    icon: "🥈",
    textColor: "text-slate-300",
    gradient: "from-slate-500 to-slate-300",
    borderAccent: "hover:border-slate-400/40",
    gradientFrom: "#64748b",
    gradientTo: "#cbd5e1",
  },
  {
    // 2 — Gold
    icon: "🥇",
    textColor: "text-amber-400",
    gradient: "from-amber-700 to-amber-400",
    borderAccent: "hover:border-amber-400/40",
    gradientFrom: "#92400e",
    gradientTo: "#fbbf24",
  },
  {
    // 3 — Platinum
    icon: "💎",
    textColor: "text-purple-300",
    gradient: "from-purple-700 to-blue-400",
    borderAccent: "hover:border-purple-400/40",
    gradientFrom: "#7e22ce",
    gradientTo: "#60a5fa",
  },
];

/** Helper — safely get tier color by index, falling back to the last entry */
export function getTierColor(index: number): TierColorConfig {
  return tierColors[index] ?? tierColors[tierColors.length - 1];
}