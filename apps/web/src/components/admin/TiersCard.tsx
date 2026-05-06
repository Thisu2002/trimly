"use client";

import { Award, Edit, Check } from "lucide-react";
import type { LoyaltyTier } from "@/types";
import { getTierColor, lTheme } from "@/theme/loyaltyTheme";

interface Props {
  tiers: LoyaltyTier[];
  onEditTier: (tier: LoyaltyTier, index: number) => void;
}

export function TiersCard({ tiers, onEditTier }: Props) {
  return (
    <div className="bg-[#111827] border border-gray-700 rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold">Membership Tiers</h2>
          <p className="text-gray-400 text-sm">
            Manage tier thresholds and benefits
          </p>
        </div>
        {/* Primary accent icon */}
        <Award className={`w-5 h-5 ${lTheme.iconAccent}`} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tiers.map((tier, i) => {
          const colors = getTierColor(i);
          return (
            <div
              key={tier.id}
              className={`p-4 ${lTheme.innerCardBg} border border-gray-700 rounded-xl ${colors.borderAccent} transition-colors text-center`}
            >
              <div className="text-3xl mb-2">{colors.icon}</div>

              <h3 className={`font-semibold text-sm ${colors.textColor}`}>
                {tier.name}
              </h3>

              {/*
               * Gradient border trick — CSS can't apply gradients to `border-color`,
               * so we wrap the badge in a 1 px gradient shell and put the real
               * background on the inner element.
               *
               * Structure:
               *   <div  gradient bg, padding 1px, rounded-full>   ← "border"
               *     <div  real bg, rounded-full, px/py>            ← content
               *   </div>
               */}
              <div className="flex justify-center mt-1.5 mb-2">
                <div
                  className={`p-[1px] rounded-full bg-gradient-to-r ${colors.gradient}`}
                >
                  <div className="rounded-full bg-[#0f172a] px-2.5 py-0.5 text-xs text-white whitespace-nowrap">
                    {tier.threshold}+ pts
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 mb-3">
                {tier.multiplier}x multiplier
              </p>

              {/* Benefits preview */}
              <div className="space-y-1.5 mb-4 text-left">
                {tier.benefits.slice(0, 2).map((b, bi) => (
                  <div
                    key={bi}
                    className="flex items-start gap-1.5 text-xs text-gray-400"
                  >
                    <Check className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="leading-relaxed">{b}</span>
                  </div>
                ))}
                {tier.benefits.length > 2 && (
                  <p className="text-xs text-gray-600 pl-4">
                    +{tier.benefits.length - 2} more
                  </p>
                )}
              </div>

              {/* Edit button — primary accent on hover */}
              <button
                onClick={() => onEditTier(tier, i)}
                className={`w-full py-1.5 rounded-lg border border-gray-700 text-gray-400 text-xs
                  hover:bg-gray-800 hover:${lTheme.textAccent} hover:border-[#abd5ff]/40
                  transition-colors flex items-center justify-center gap-1.5`}
              >
                <Edit className="w-3 h-3" />
                Edit Tier
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}