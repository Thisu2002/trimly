//D:\trimly\apps\web\src\theme\tierColors.ts
export interface TierColorConfig {
  icon: string;
  gradient: string;       // Tailwind gradient classes for badge/pill
  iconBg: string;         // Icon background gradient
  textColor: string;      // Tailwind text color class
  borderAccent: string;   // Hover border color class
}

const TIER_COLORS: TierColorConfig[] = [
  // Index 0 — Bronze
  {
    icon: "🥉",
    gradient: "from-orange-800 to-orange-600",
    iconBg: "from-orange-800 to-orange-600",
    textColor: "text-orange-400",
    borderAccent: "hover:border-orange-500/40",
  },
  // Index 1 — Silver
  {
    icon: "🥈",
    gradient: "from-slate-500 to-slate-400",
    iconBg: "from-slate-500 to-slate-400",
    textColor: "text-slate-300",
    borderAccent: "hover:border-slate-400/40",
  },
  // Index 2 — Gold
  {
    icon: "🥇",
    gradient: "from-[#373005] to-[#d4af37]",
    iconBg: "from-[#373005] to-[#d4af37]",
    textColor: "text-[#d4af37]",
    borderAccent: "hover:border-emerald-500/40",
  },
  // Index 3 — Platinum / deep purple-blue
  {
    icon: "💎",
    gradient: "from-purple-700 to-blue-400",
    iconBg: "from-purple-700 to-blue-400",
    textColor: "text-purple-300",
    borderAccent: "hover:border-purple-400/40",
  },
  // Index 4 — Teal/Emerald
  {
    icon: "🔮",
    gradient: "from-teal-700 to-emerald-400",
    iconBg: "from-teal-700 to-emerald-400",
    textColor: "text-emerald-400",
    borderAccent: "hover:border-emerald-500/40",
  },  
  // Index 5+
  {
    icon: "⚡",
    gradient: "from-rose-700 to-pink-400",
    iconBg: "from-rose-700 to-pink-400",
    textColor: "text-rose-400",
    borderAccent: "hover:border-rose-400/40",
  },
  {
    icon: "🌟",
    gradient: "from-cyan-700 to-sky-400",
    iconBg: "from-cyan-700 to-sky-400",
    textColor: "text-cyan-400",
    borderAccent: "hover:border-cyan-400/40",
  },
];

export function getTierColor(index: number): TierColorConfig {
  return TIER_COLORS[index % TIER_COLORS.length];
}