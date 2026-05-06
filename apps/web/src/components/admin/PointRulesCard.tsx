"use client";

import { useState } from "react";
import {
  Settings,
  Edit,
  Save,
  Check,
  MessageSquare,
  Calendar,
  DollarSign,
} from "lucide-react";
import type { PointsRule } from "@/types";
import { lTheme } from "@/theme/loyaltyTheme";

const ICON_MAP: Record<string, React.ElementType> = {
  check: Check,
  message: MessageSquare,
  calendar: Calendar,
  dollar: DollarSign,
};

const COLOR_MAP: Record<string, string> = {
  green: "from-green-700 to-emerald-500",
  blue: "from-blue-700 to-cyan-500",
  purple: "from-purple-700 to-pink-500",
  gray: "from-gray-600 to-gray-400",
};

interface Props {
  rules: PointsRule[];
  onSave: (ruleId: string, newPoints: number) => Promise<void>;
}

export function PointRulesCard({ rules, onSave }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPoints, setEditingPoints] = useState(0);
  const [saving, setSaving] = useState(false);

  const handleSave = async (id: string) => {
    setSaving(true);
    try {
      await onSave(id, editingPoints);
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#111827] border border-gray-700 rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold">Points Rules</h2>
          <p className="text-gray-400 text-sm">
            Configure how customers earn points
          </p>
        </div>
        {/* Primary accent icon */}
        <Settings className={`w-5 h-5 ${lTheme.iconAccent}`} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {rules.map((rule) => {
          const Icon = ICON_MAP[rule.iconKey] ?? Check;
          const colorClass = COLOR_MAP[rule.colorKey] ?? "from-gray-600 to-gray-400";
          const isEditing = editingId === rule.id;

          return (
            <div
              key={rule.id}
              className={`p-4 ${lTheme.innerCardBg} border border-gray-700 rounded-xl ${lTheme.borderAccentHover} transition-colors`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center flex-shrink-0`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>

                <div className="flex-1">
                  <p className="font-medium text-white text-sm">{rule.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5 mb-3">
                    {rule.description}
                  </p>

                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <input
                          type="number"
                          value={editingPoints}
                          onChange={(e) =>
                            setEditingPoints(parseInt(e.target.value) || 0)
                          }
                          className={`w-20 h-7 px-2 bg-gray-800 border border-gray-600 rounded text-white text-sm outline-none ${lTheme.borderAccentFocus} transition-colors`}
                          min="0"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSave(rule.id)}
                          disabled={saving}
                          className={`h-7 px-3 rounded bg-gray-700 hover:bg-gray-600 ${lTheme.textAccent} text-xs flex items-center gap-1 disabled:opacity-50 transition-colors`}
                        >
                          <Save className={`w-3 h-3 ${lTheme.iconAccent}`} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className={`h-7 px-2 rounded ${lTheme.textAccent} hover:text-gray-300 text-xs transition-colors`}
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        {/* pts badge — accent tint */}
                        <span
                          className={`text-xs text-gray-400 px-2 py-1 rounded ${lTheme.badgeBg} border border-gray-600`}
                        >
                          {rule.points} pts
                        </span>
                        <button
                          onClick={() => {
                            setEditingId(rule.id);
                            setEditingPoints(rule.points);
                          }}
                          className={`h-7 w-7 rounded flex items-center justify-center text-gray-600 hover:text-gray-300 hover:bg-gray-800 transition-colors`}
                        >
                          <Edit className={`w-3 h-3 ${lTheme.iconAccent}`} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}