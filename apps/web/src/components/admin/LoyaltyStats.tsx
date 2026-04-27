"use client";

import { motion } from "motion/react";
import { Users, TrendingUp, Zap, Gift } from "lucide-react";
import type { LoyaltyStats } from "@/types";

interface Props {
  stats: LoyaltyStats;
}

const STAT_CONFIG = [
  {
    key: "totalMembers" as const,
    label: "Total Members",
    icon: Users,
    iconBg: "from-gray-600 to-gray-500",
  },
  {
    key: "activeMembers" as const,
    label: "Active Members",
    icon: TrendingUp,
    iconBg: "from-green-700 to-emerald-500",
  },
  {
    key: "pointsIssued" as const,
    label: "Points Issued",
    icon: Zap,
    iconBg: "from-blue-700 to-cyan-500",
  },
  {
    key: "rewardsRedeemed" as const,
    label: "Rewards Redeemed",
    icon: Gift,
    iconBg: "from-purple-700 to-pink-500",
  },
];

export function LoyaltyStats({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {STAT_CONFIG.map((cfg, i) => {
        const Icon = cfg.icon;
        const value = stats[cfg.key];
        return (
          <motion.div
            key={cfg.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.3 }}
            className="bg-[#111827] border border-gray-700 rounded-xl p-5 flex items-center gap-4"
          >
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${cfg.iconBg} flex-shrink-0`}
            >
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">{cfg.label}</p>
              <p className="text-xl font-semibold text-white">
                {typeof value === "number" ? value.toLocaleString() : value}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}