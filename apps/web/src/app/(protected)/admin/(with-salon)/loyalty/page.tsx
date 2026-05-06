"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import { Plus } from "lucide-react";
import { getAccessToken } from "@auth0/nextjs-auth0/client";

import { LoyaltyStats } from "@/components/admin/LoyaltyStats";
import { PointRulesCard } from "@/components/admin/PointRulesCard";
import { TiersCard } from "@/components/admin/TiersCard";
import { RewardsCard } from "@/components/admin/RewardsCard";
import { AddRewardModal } from "@/components/admin/AddRewardModal";
import { EditTierModal } from "@/components/admin/EditTierModal";
import type {
  LoyaltyTier,
  LoyaltyReward,
  PointsRule,
  LoyaltyStats as LoyaltyStatsType,
} from "@/types";

const API = process.env.NEXT_PUBLIC_API_BASE_URL!;

async function authedGet(path: string) {
  const token = await getAccessToken();
  const res = await fetch(`${API}${path}?idToken=${token}`);
  if (!res.ok) throw new Error(`GET ${path} failed`);
  return res.json();
}

async function authedPost(path: string, body: object) {
  const token = await getAccessToken();
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: token, ...body }),
  });
  if (!res.ok) throw new Error(`POST ${path} failed`);
  return res.json();
}

async function authedPatch(path: string, body: object) {
  const token = await getAccessToken();
  const res = await fetch(`${API}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: token, ...body }),
  });
  if (!res.ok) throw new Error(`PATCH ${path} failed`);
  return res.json();
}

async function authedDelete(path: string) {
  const token = await getAccessToken();
  const res = await fetch(`${API}${path}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: token }),
  });
  if (!res.ok) throw new Error(`DELETE ${path} failed`);
  return res.json();
}

export default function LoyaltyPage() {
  const [stats, setStats] = useState<LoyaltyStatsType>({
    totalMembers: 0,
    activeMembers: 0,
    pointsIssued: 0,
    rewardsRedeemed: 0,
  });
  const [rules, setRules] = useState<PointsRule[]>([]);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateReward, setShowCreateReward] = useState(false);
  const [editingTier, setEditingTier] = useState<{
    tier: LoyaltyTier;
    index: number;
  } | null>(null);

  const isModalOpen = showCreateReward || !!editingTier;

  async function fetchAll() {
    try {
      setLoading(true);
      const [statsData, rulesData, tiersData, rewardsData] = await Promise.all([
        authedGet("/api/loyalty/stats"),
        authedGet("/api/loyalty/rules"),
        authedGet("/api/loyalty/tiers"),
        authedGet("/api/loyalty/rewards"),
      ]);
      setStats(statsData);
      setRules(rulesData);
      setTiers(tiersData);
      setRewards(rewardsData);
    } catch (err) {
      console.error("Failed to load loyalty data", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    const content = document.getElementById("admin-content");
    if (!content) return;
    if (isModalOpen) {
      content.scrollTo({ top: 0, behavior: "smooth" });
      content.style.overflow = "hidden";
    } else {
      content.style.overflow = "";
    }
    return () => { content.style.overflow = ""; };
  }, [isModalOpen]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleSaveRule(ruleId: string, newPoints: number) {
    await authedPatch(`/api/loyalty/rules/${ruleId}`, { points: newPoints });
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, points: newPoints } : r))
    );
  }

  async function handleSaveTier(updated: LoyaltyTier) {
    await authedPatch(`/api/loyalty/tiers/${updated.id}`, {
      threshold: updated.threshold,
      multiplier: updated.multiplier,
      benefits: updated.benefits,
    });
    setTiers((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  async function handleCreateReward(
    data: Omit<LoyaltyReward, "id" | "totalRedeemed">
  ) {
    const created = await authedPost("/api/loyalty/rewards", data);
    setRewards((prev) => [...prev, created]);
  }

  async function handleDeleteReward(id: string) {
    await authedDelete(`/api/loyalty/rewards/${id}`);
    setRewards((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleToggleReward(id: string, active: boolean) {
    await authedPatch(`/api/loyalty/rewards/${id}`, { active });
    setRewards((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active } : r))
    );
  }

  async function handleEditReward(
    id: string,
    data: Partial<Omit<LoyaltyReward, "id" | "totalRedeemed">>
  ) {
    await authedPatch(`/api/loyalty/rewards/${id}`, data);
    setRewards((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...data } : r))
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div
        className={`relative space-y-6 transition duration-150 ${
          isModalOpen ? "pointer-events-none blur-sm opacity-10" : ""
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">Loyalty Program</h1>
            <p className="text-gray-400 text-sm">
              Configure points, tiers and rewards for your customers
            </p>
          </div>
          <button
            onClick={() => setShowCreateReward(true)}
            className="border border-[#abd5ff]/40 text-[#abd5ff] px-4 py-2 rounded-lg
              hover:bg-[#abd5ff]/10 flex items-center gap-2 text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Reward
          </button>
        </div>

        {loading ? (
          <div className="text-gray-400 text-sm">Loading loyalty data...</div>
        ) : (
          <>
            <LoyaltyStats stats={stats} />
            <PointRulesCard rules={rules} onSave={handleSaveRule} />
            <TiersCard
              tiers={tiers}
              onEditTier={(tier, index) => setEditingTier({ tier, index })}
            />
            <RewardsCard
              rewards={rewards}
              tiers={tiers}
              onDelete={handleDeleteReward}
              onToggleActive={handleToggleReward}
              onEdit={handleEditReward}
            />
          </>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateReward && (
          <AddRewardModal
            tiers={tiers}
            onClose={() => setShowCreateReward(false)}
            onSave={handleCreateReward}
          />
        )}
        {editingTier && (
          <EditTierModal
            tier={editingTier.tier}
            tierIndex={editingTier.index}
            onClose={() => setEditingTier(null)}
            onSave={handleSaveTier}
          />
        )}
      </AnimatePresence>
    </>
  );
}