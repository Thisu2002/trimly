"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Gift, Edit, Trash2, Zap, TrendingUp } from "lucide-react";
import type { LoyaltyReward, LoyaltyTier } from "@/types";
import { EditRewardModal } from "@/components/admin/EditRewardModal";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";

interface Props {
  rewards: LoyaltyReward[];
  tiers: LoyaltyTier[];
  onDelete: (id: string) => Promise<void>;
  onToggleActive: (id: string, active: boolean) => Promise<void>;
  onEdit: (id: string, data: Partial<Omit<LoyaltyReward, "id" | "totalRedeemed">>) => Promise<void>;
}

export function RewardsCard({ rewards, tiers, onDelete, onToggleActive, onEdit }: Props) {
  const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const deletingReward = rewards.find((r) => r.id === deletingId);

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    try {
      await onDelete(deletingId);
      setDeletingId(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <div className="bg-[#111827] border border-gray-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold">Active Rewards</h2>
            <p className="text-gray-400 text-sm">
              Manage redeemable rewards for customers
            </p>
          </div>
          <Gift className="w-5 h-5 text-gray-400" />
        </div>

        {rewards.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            <Gift className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No rewards yet. Create your first one.</p>
          </div>
        )}

        <div className="space-y-3">
          {rewards.map((reward, i) => (
            <motion.div
              key={reward.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
              className="flex items-center gap-4 p-4 bg-[#0f172a] rounded-xl border border-gray-700 hover:border-gray-600 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="font-medium text-white text-sm">{reward.name}</h4>
                  <span className="text-xs px-2 py-0.5 rounded border border-gray-700 text-gray-400">
                    {reward.tierRequired}+
                  </span>
                  {reward.active ? (
                    <span className="text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                      Active
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-500 border border-gray-700">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-2 truncate">{reward.description}</p>
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {reward.pointsCost} points
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {reward.totalRedeemed} redeemed
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={() => onToggleActive(reward.id, !reward.active)}
                  title={reward.active ? "Deactivate" : "Activate"}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-300 hover:bg-gray-800 transition-colors text-xs"
                >
                  {reward.active ? "⏸" : "▶"}
                </button>
                <button
                  onClick={() => setEditingReward(reward)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-300 hover:bg-gray-800 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeletingId(reward.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {editingReward && (
          <EditRewardModal
            reward={editingReward}
            tiers={tiers}
            onClose={() => setEditingReward(null)}
            onSave={onEdit}
          />
        )}
      </AnimatePresence>

      <ConfirmDeleteDialog
        open={!!deletingId}
        title="Delete this reward?"
        message={
          deletingReward
            ? `"${deletingReward.name}" will be permanently removed. Customers who already redeemed it are unaffected.`
            : "This reward will be permanently removed."
        }
        confirmLabel="Delete Reward"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingId(null)}
        loading={deleteLoading}
      />
    </>
  );
}