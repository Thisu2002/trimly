"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Save, X, Plus, Trash2 } from "lucide-react";
import type { LoyaltyTier } from "@/types";
import { getTierColor } from "@/theme/tierColors";

interface Props {
  tier: LoyaltyTier;
  tierIndex: number;
  onClose: () => void;
  onSave: (updated: LoyaltyTier) => Promise<void>;
}

export function EditTierModal({ tier, tierIndex, onClose, onSave }: Props) {
  const colors = getTierColor(tierIndex);

  const [form, setForm] = useState({
    threshold: tier.threshold,
    multiplier: tier.multiplier,
    benefits: [...tier.benefits],
  });
  const [newBenefit, setNewBenefit] = useState("");
  const [saving, setSaving] = useState(false);

  const addBenefit = () => {
    if (newBenefit.trim()) {
      setForm({ ...form, benefits: [...form.benefits, newBenefit.trim()] });
      setNewBenefit("");
    }
  };

  const removeBenefit = (i: number) =>
    setForm({ ...form, benefits: form.benefits.filter((_, idx) => idx !== i) });

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSave({ ...tier, ...form });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18 }}
        className="bg-[#0b1220] border border-gray-700 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{colors.icon}</span>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Edit {tier.name} Tier
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Tier #{tierIndex + 1}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Threshold + Multiplier */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                Points Threshold
              </label>
              <input
                type="number"
                value={form.threshold}
                onChange={(e) =>
                  setForm({ ...form, threshold: parseInt(e.target.value) || 0 })
                }
                disabled={tierIndex === 0}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white outline-none focus:border-gray-500 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-gray-600 mt-1">
                {tierIndex === 0
                  ? "Always 0 for base tier"
                  : "Min points to reach this tier"}
              </p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                Points Multiplier
              </label>
              <input
                type="number"
                value={form.multiplier}
                onChange={(e) =>
                  setForm({
                    ...form,
                    multiplier: parseFloat(e.target.value) || 1,
                  })
                }
                min="1"
                step="0.1"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white outline-none focus:border-gray-500 transition-colors text-sm"
              />
              <p className="text-xs text-gray-600 mt-1">
                Point earning multiplier (e.g. 1.5x)
              </p>
            </div>
          </div>

          {/* Benefits */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Tier Benefits
            </label>
            <div className="space-y-2 mb-3 max-h-44 overflow-y-auto pr-1">
              {form.benefits.length === 0 && (
                <p className="text-xs text-gray-600 py-2">No benefits added yet.</p>
              )}
              {form.benefits.map((b, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                >
                  <span className="text-sm text-gray-300 flex-1">{b}</span>
                  <button
                    onClick={() => removeBenefit(i)}
                    className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newBenefit}
                onChange={(e) => setNewBenefit(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addBenefit();
                  }
                }}
                placeholder="Add a benefit and press Enter..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder:text-gray-600 outline-none focus:border-gray-500 transition-colors text-sm"
              />
              <button
                onClick={addBenefit}
                className="px-3 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mini preview */}
          <div className="p-3 bg-gray-800/30 rounded-xl border border-gray-700/50">
            <p className="text-xs text-gray-600 mb-2">Preview</p>
            <div className="flex items-center gap-3">
              <span className="text-xl">{colors.icon}</span>
              <div>
                <p className={`text-sm font-semibold ${colors.textColor}`}>
                  {tier.name}
                </p>
                <p className="text-xs text-gray-500">
                  {form.threshold}+ pts • {form.multiplier}x multiplier
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}