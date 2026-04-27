"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Save, X, Zap } from "lucide-react";
import type { LoyaltyReward, LoyaltyTier } from "@/types";
import { getTierColor } from "@/theme/tierColors";

interface Props {
  reward: LoyaltyReward;
  tiers: LoyaltyTier[];
  onClose: () => void;
  onSave: (id: string, data: Partial<Omit<LoyaltyReward, "id" | "totalRedeemed">>) => Promise<void>;
}

export function EditRewardModal({ reward, tiers, onClose, onSave }: Props) {
  const [form, setForm] = useState({
    name: reward.name,
    description: reward.description,
    pointsCost: String(reward.pointsCost),
    tierRequired: reward.tierRequired,
    active: reward.active,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Reward name is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.pointsCost || parseInt(form.pointsCost) <= 0)
      e.pointsCost = "Valid points cost is required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave(reward.id, {
        name: form.name.trim(),
        description: form.description.trim(),
        pointsCost: parseInt(form.pointsCost),
        tierRequired: form.tierRequired,
        active: form.active,
      });
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
          <h2 className="text-xl font-semibold text-white">Edit Reward</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">
              Reward Name <span className="text-red-400">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder:text-gray-500 outline-none focus:border-gray-500 transition-colors text-sm"
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder:text-gray-500 outline-none focus:border-gray-500 transition-colors resize-none text-sm"
            />
            {errors.description && (
              <p className="text-red-400 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          {/* Points + Tier */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                Points Cost <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={form.pointsCost}
                onChange={(e) => setForm({ ...form, pointsCost: e.target.value })}
                min="1"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white outline-none focus:border-gray-500 transition-colors text-sm"
              />
              {errors.pointsCost && (
                <p className="text-red-400 text-xs mt-1">{errors.pointsCost}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Minimum Tier</label>
              <select
                value={form.tierRequired}
                onChange={(e) => setForm({ ...form, tierRequired: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white outline-none focus:border-gray-500 transition-colors text-sm"
              >
                {tiers.map((t, i) => (
                  <option key={t.id} value={t.name}>
                    {getTierColor(i).icon} {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-800/40 rounded-lg border border-gray-700">
            <div>
              <p className="text-sm text-white">Active</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Inactive rewards are hidden from customers
              </p>
            </div>
            <button
              onClick={() => setForm({ ...form, active: !form.active })}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                form.active ? "bg-green-600" : "bg-gray-700"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  form.active ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Preview */}
          <div className="p-4 bg-gray-800/40 rounded-xl border border-gray-700">
            <p className="text-xs text-gray-500 mb-2">Preview</p>
            <div className="p-3 bg-[#111827] rounded-lg">
              <h4 className="text-white font-medium text-sm">
                {form.name || "Reward Name"}
              </h4>
              <p className="text-xs text-gray-400 mt-1">
                {form.description || "Reward description"}
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className="flex items-center gap-1 text-gray-300">
                  <Zap className="w-3 h-3 text-gray-400" />
                  {form.pointsCost || "0"} points
                </span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-400">{form.tierRequired}+ tier</span>
                <span className="text-gray-600">•</span>
                <span className={form.active ? "text-green-400" : "text-gray-500"}>
                  {form.active ? "Active" : "Inactive"}
                </span>
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