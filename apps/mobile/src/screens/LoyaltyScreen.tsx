// D:\trimly\apps\mobile\src\screens\LoyaltyScreen.tsx

import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { getTierColor } from "../lib/tierColors";
import type {
  LoyaltySummaryResponse,
  CustomerReward,
  TierWithStatus,
  HistoryEntry,
  LoyaltyRule,
} from "../types/loyalty";
import { API_BASE_URL } from "../config/api";


const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 36;

// ─── API ──────────────────────────────────────────────────────────────────────

async function fetchLoyaltySummary(
  idToken: string,
  salonId?: string
): Promise<LoyaltySummaryResponse> {
  const params = new URLSearchParams({ idToken });
  if (salonId) params.set("salonId", salonId);
  const res = await fetch(`${API_BASE_URL}/api/loyalty-mobile/customer/summary?${params}`);
  if (!res.ok) throw new Error("Failed to load loyalty data");
  return res.json();
}

async function redeemReward(
  idToken: string,
  rewardId: string,
  salonId?: string
): Promise<{ ok: boolean; message: string; newBalance: number }> {
  const res = await fetch(`${API_BASE_URL}/api/loyalty-mobile/customer/redeem`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, rewardId, salonId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Redemption failed");
  }
  return res.json();
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  idToken: string;
  salonId?: string; // optional: pre-select a salon's program
}

// ─── Tab type ─────────────────────────────────────────────────────────────────

type Tab = "rewards" | "tiers" | "history";

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function LoyaltyScreen({ idToken, salonId }: Props) {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<LoyaltySummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("rewards");
  const [redeeming, setRedeeming] = useState<string | null>(null);

  // Progress bar animation
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (data?.points?.tierProgress !== undefined) {
      Animated.timing(progressAnim, {
        toValue: data.points.tierProgress / 100,
        duration: 900,
        delay: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [data?.points?.tierProgress]);

  async function load() {
    try {
      setLoading(true);
      const result = await fetchLoyaltySummary(idToken, salonId);
      setData(result);
      console.log("Loyalty summary loaded:", result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleRedeem(reward: CustomerReward) {
    if (!reward.canRedeem) return;
    Alert.alert(
      "Redeem Reward",
      `Use ${reward.pointsCost} points for "${reward.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Redeem",
          onPress: async () => {
            setRedeeming(reward.id);
            try {
              const result = await redeemReward(idToken, reward.id, salonId);
              Alert.alert("Redeemed! 🎉", result.message);
              await load(); // refresh
            } catch (err: any) {
              Alert.alert("Failed", err.message ?? "Something went wrong");
            } finally {
              setRedeeming(null);
            }
          },
        },
      ]
    );
  }

  const tierColors =
    data?.currentTier != null ? getTierColor(data.currentTier.sortOrder) : null;

  if (loading) {
    return (
      <LinearGradient
        colors={[colors.gradientLeft, colors.gradientRight]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 2, y: 0.5 }}
        style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
      >
        <ActivityIndicator color={colors.primaryLight} size="large" />
        <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 13 }}>
          Loading your rewards...
        </Text>
      </LinearGradient>
    );
  }

  // Empty state — no completed appointments yet
  const isEmpty = !data || !data.points;

  return (
    <LinearGradient
      colors={[colors.gradientLeft, colors.gradientRight]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 2, y: 0.5 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: 72 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Loyalty & Rewards</Text>
            <Pressable onPress={load} style={styles.refreshBtn}>
              <Ionicons name="refresh" size={18} color={colors.primaryLight} />
            </Pressable>
          </View>

          {isEmpty ? (
            <EmptyState />
          ) : (
            <>
              {/* ── Points Hero Card ── */}
              <PointsHeroCard
                data={data!}
                tierColors={tierColors}
                progressAnim={progressAnim}
              />

              {/* ── Tabs ── */}
              <TabBar activeTab={activeTab} onSelect={setActiveTab} />

              {/* ── Tab Content ── */}
              {activeTab === "rewards" && (
                <RewardsTab
                  rewards={data!.availableRewards}
                  onRedeem={handleRedeem}
                  redeeming={redeeming}
                />
              )}
              {activeTab === "tiers" && (
                <TiersTab
                  tiers={data!.tiers}
                  currentPoints={data!.points!.lifetime}
                />
              )}
              {activeTab === "history" && (
                <HistoryTab history={data!.history} rules={data!.rules} />
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Points Hero Card ─────────────────────────────────────────────────────────

function PointsHeroCard({
  data,
  tierColors,
  progressAnim,
}: {
  data: LoyaltySummaryResponse;
  tierColors: ReturnType<typeof getTierColor> | null;
  progressAnim: Animated.Value;
}) {
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const tc = tierColors ?? {
    icon: "🥉",
    gradientColors: ["#92400e", "#c2410c"] as [string, string],
    textColor: "#fb923c",
    badgeBg: "rgba(146, 64, 14, 0.3)",
    glowColor: "rgba(194, 65, 12, 0.4)",
  };

  return (
    <View style={styles.heroCard}>
      {/* Glow blob */}
      <View style={[styles.heroGlow, { backgroundColor: tc.glowColor }]} />

      <LinearGradient
        colors={["rgba(20,28,45,0.92)", "rgba(15,23,42,0.95)"]}
        style={styles.heroCardInner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Top row */}
        <View style={styles.heroTopRow}>
          <View>
            <Text style={styles.heroPointsLabel}>Your Points</Text>
            <Text style={styles.heroPoints}>
              {data.points!.total.toLocaleString()}
            </Text>
            <Text style={styles.heroLifetime}>
              {data.points!.lifetime.toLocaleString()} lifetime
            </Text>
          </View>

          {/* Tier badge */}
          <View style={[styles.tierBadge, { backgroundColor: tc.badgeBg }]}>
            <Text style={styles.tierBadgeIcon}>{tc.icon}</Text>
            <Text style={[styles.tierBadgeName, { color: tc.textColor }]}>
              {data.currentTier?.name ?? "Bronze"}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.heroDivider} />

        {/* Progress */}
        {data.nextTier ? (
          <View>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>
                Progress to {data.nextTier.name}
              </Text>
              <Text style={styles.progressPts}>
                {data.points!.toNextTier} pts to go
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { width: progressWidth, backgroundColor: tc.textColor },
                ]}
              />
            </View>
            <Text style={styles.progressPercent}>
              {data.points!.tierProgress}% complete
            </Text>
          </View>
        ) : (
          <View style={styles.maxTierRow}>
            <Ionicons name="trophy" size={16} color={tc.textColor} />
            <Text style={[styles.maxTierText, { color: tc.textColor }]}>
              You've reached the highest tier!
            </Text>
          </View>
        )}

        {/* Mini stats */}
        <View style={styles.miniStatsRow}>
          <View style={styles.miniStat}>
            <Ionicons name="flash" size={14} color={colors.primaryLight} />
            <Text style={styles.miniStatValue}>{data.points!.total}</Text>
            <Text style={styles.miniStatLabel}>Available</Text>
          </View>
          <View style={styles.miniStatDivider} />
          <View style={styles.miniStat}>
            <Ionicons name="gift" size={14} color={colors.accent} />
            <Text style={styles.miniStatValue}>
              {data.availableRewards.filter((r) => r.canRedeem).length}
            </Text>
            <Text style={styles.miniStatLabel}>Redeemable</Text>
          </View>
          <View style={styles.miniStatDivider} />
          <View style={styles.miniStat}>
            <Ionicons name="layers" size={14} color={tc.textColor} />
            <Text style={styles.miniStatValue}>{data.currentTier?.multiplier ?? 1}x</Text>
            <Text style={styles.miniStatLabel}>Multiplier</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "rewards", label: "Rewards", icon: "gift-outline" },
  { key: "tiers", label: "Tiers", icon: "trophy-outline" },
  { key: "history", label: "History", icon: "time-outline" },
];

function TabBar({
  activeTab,
  onSelect,
}: {
  activeTab: Tab;
  onSelect: (t: Tab) => void;
}) {
  return (
    <View style={styles.tabBar}>
      {TABS.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onSelect(tab.key)}
            style={[styles.tabBtn, active && styles.tabBtnActive]}
          >
            <Ionicons
              name={tab.icon as any}
              size={15}
              color={active ? colors.white : colors.textMuted}
            />
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Rewards Tab ──────────────────────────────────────────────────────────────

function RewardsTab({
  rewards,
  onRedeem,
  redeeming,
}: {
  rewards: CustomerReward[];
  onRedeem: (r: CustomerReward) => void;
  redeeming: string | null;
}) {
  if (rewards.length === 0) {
    return (
      <View style={styles.emptySection}>
        <Ionicons name="gift-outline" size={40} color={colors.textMuted} style={{ opacity: 0.4 }} />
        <Text style={styles.emptySectionText}>No rewards available yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Available Rewards</Text>
      {rewards.map((reward) => (
        <RewardCard
          key={reward.id}
          reward={reward}
          onRedeem={onRedeem}
          isRedeeming={redeeming === reward.id}
        />
      ))}
    </View>
  );
}

function RewardCard({
  reward,
  onRedeem,
  isRedeeming,
}: {
  reward: CustomerReward;
  onRedeem: (r: CustomerReward) => void;
  isRedeeming: boolean;
}) {
  const locked = !reward.canRedeem;

  return (
    <View style={[styles.rewardCard, locked && styles.rewardCardLocked]}>
      <LinearGradient
        colors={
          locked
            ? ["rgba(20,28,45,0.5)", "rgba(15,23,42,0.5)"]
            : ["rgba(20,28,45,0.95)", "rgba(25,35,55,0.95)"]
        }
        style={styles.rewardCardInner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.rewardCardTop}>
          <View style={styles.rewardCardIcon}>
            <Ionicons
              name="gift"
              size={20}
              color={locked ? colors.textMuted : colors.primaryLight}
            />
          </View>
          <View style={styles.rewardCardInfo}>
            <Text style={[styles.rewardName, locked && { color: colors.textMuted }]}>
              {reward.name}
            </Text>
            <Text style={styles.rewardDesc}>{reward.description}</Text>
          </View>
        </View>

        <View style={styles.rewardCardBottom}>
          <View style={styles.rewardMeta}>
            <Ionicons name="flash" size={12} color={colors.primaryLight} />
            <Text style={styles.rewardPoints}>{reward.pointsCost} pts</Text>
            {reward.tierLocked && (
              <>
                <View style={styles.metaDot} />
                <Ionicons name="lock-closed" size={11} color={colors.textMuted} />
                <Text style={styles.rewardTierLock}>{reward.tierRequired}+ required</Text>
              </>
            )}
          </View>

          <Pressable
            onPress={() => onRedeem(reward)}
            disabled={locked || isRedeeming}
            style={[
              styles.redeemBtn,
              locked && styles.redeemBtnDisabled,
            ]}
          >
            {isRedeeming ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={[styles.redeemBtnText, locked && { color: colors.textMuted }]}>
                {reward.tierLocked ? "Locked" : locked ? "Not enough pts" : "Redeem"}
              </Text>
            )}
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
}

// ─── Tiers Tab ────────────────────────────────────────────────────────────────

function TiersTab({
  tiers,
  currentPoints,
}: {
  tiers: TierWithStatus[];
  currentPoints: number;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Membership Tiers</Text>
      {tiers.map((tier) => {
        const tc = getTierColor(tier.sortOrder);
        return (
          <View
            key={tier.id}
            style={[styles.tierCard, tier.isCurrent && styles.tierCardCurrent]}
          >
            <LinearGradient
              colors={
                tier.unlocked
                  ? ["rgba(20,28,45,0.95)", "rgba(25,35,55,0.9)"]
                  : ["rgba(12,18,30,0.6)", "rgba(10,15,25,0.6)"]
              }
              style={styles.tierCardInner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {tier.isCurrent && (
                <View style={[styles.currentBadge, { backgroundColor: tc.badgeBg }]}>
                  <Text style={[styles.currentBadgeText, { color: tc.textColor }]}>
                    Current
                  </Text>
                </View>
              )}

              <View style={styles.tierCardHeader}>
                <Text style={styles.tierIcon}>{tc.icon}</Text>
                <View style={styles.tierCardHeaderText}>
                  <Text
                    style={[
                      styles.tierName,
                      { color: tier.unlocked ? tc.textColor : colors.textMuted },
                    ]}
                  >
                    {tier.name}
                  </Text>
                  <Text style={styles.tierThreshold}>
                    {tier.threshold === 0 ? "Starting tier" : `${tier.threshold}+ lifetime pts`}
                    {"  ·  "}
                    {tier.multiplier}x multiplier
                  </Text>
                </View>
                {tier.unlocked ? (
                  <Ionicons name="checkmark-circle" size={20} color={tc.textColor} />
                ) : (
                  <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
                )}
              </View>

              <View style={styles.tierBenefitsList}>
                {tier.benefits.map((b, i) => (
                  <View key={i} style={styles.tierBenefitRow}>
                    <Ionicons
                      name={tier.unlocked ? "checkmark" : "ellipse-outline"}
                      size={12}
                      color={tier.unlocked ? tc.textColor : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.tierBenefitText,
                        !tier.unlocked && { color: colors.textMuted, opacity: 0.6 },
                      ]}
                    >
                      {b}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Progress bar if this is the next locked tier */}
              {!tier.unlocked && tiers.find((t) => t.isCurrent)?.sortOrder === tier.sortOrder - 1 && (
                <View style={styles.nextTierProgress}>
                  <View style={styles.progressTrackSmall}>
                    <View
                      style={[
                        styles.progressFillSmall,
                        {
                          width: `${Math.min(100, Math.round((currentPoints / tier.threshold) * 100))}%`,
                          backgroundColor: tc.textColor,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.nextTierProgressText}>
                    {Math.max(0, tier.threshold - currentPoints)} pts remaining
                  </Text>
                </View>
              )}
            </LinearGradient>
          </View>
        );
      })}
    </View>
  );
}

// ─── History Tab ──────────────────────────────────────────────────────────────

function HistoryTab({
  history,
  rules,
}: {
  history: HistoryEntry[];
  rules: LoyaltyRule[];
}) {
  return (
    <View style={styles.section}>
      {/* How to earn */}
      <Text style={styles.sectionTitle}>How to Earn Points</Text>
      <View style={styles.rulesGrid}>
        {rules.map((rule) => (
          <View key={rule.id} style={styles.ruleChip}>
            <Text style={styles.rulePoints}>+{rule.points}</Text>
            <Text style={styles.ruleLabel}>{rule.label}</Text>
          </View>
        ))}
      </View>

      {/* History list */}
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Recent Activity</Text>
      {history.length === 0 ? (
        <View style={styles.emptySection}>
          <Ionicons name="time-outline" size={36} color={colors.textMuted} style={{ opacity: 0.4 }} />
          <Text style={styles.emptySectionText}>No activity yet</Text>
        </View>
      ) : (
        history.map((item, i) => (
          <HistoryRow key={i} item={item} />
        ))
      )}
    </View>
  );
}

function HistoryRow({ item }: { item: HistoryEntry }) {
  const earned = item.type === "earned";
  const dateStr = new Date(item.date).toLocaleDateString("en-LK", {
    month: "short",
    day: "numeric",
  });

  return (
    <View style={styles.historyRow}>
      <View
        style={[
          styles.historyIconWrap,
          { backgroundColor: earned ? "rgba(34,197,94,0.12)" : "rgba(99,102,241,0.12)" },
        ]}
      >
        <Ionicons
          name={earned ? "flash" : "gift"}
          size={16}
          color={earned ? colors.accent : colors.primaryLight}
        />
      </View>
      <View style={styles.historyInfo}>
        <Text style={styles.historyLabel}>{item.label}</Text>
        <Text style={styles.historyDesc} numberOfLines={1}>
          {item.description}
        </Text>
      </View>
      <View style={styles.historyRight}>
        <Text
          style={[
            styles.historyPoints,
            { color: earned ? colors.accent : "#f87171" },
          ]}
        >
          {earned ? "+" : ""}
          {item.points}
        </Text>
        <Text style={styles.historyDate}>{dateStr}</Text>
      </View>
    </View>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>🎁</Text>
      <Text style={styles.emptyStateTitle}>Earn as you go</Text>
      <Text style={styles.emptyStateDesc}>
        Complete your first appointment to start earning loyalty points and unlock
        exclusive rewards.
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingTop: 8 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: 0.2,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(171,213,255,0.08)",
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
    justifyContent: "center",
  },

  // Hero card
  heroCard: {
    borderRadius: 24,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  heroGlow: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.5,
  },
  heroCardInner: {
    padding: 22,
    gap: 16,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroPointsLabel: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroPoints: {
    fontSize: 48,
    fontWeight: "800",
    color: colors.text,
    lineHeight: 54,
  },
  heroLifetime: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  tierBadge: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.glassBorder,
    gap: 4,
  },
  tierBadgeIcon: { fontSize: 24 },
  tierBadgeName: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroDivider: {
    height: 1,
    backgroundColor: colors.glassBorder,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressLabel: { fontSize: 12, color: colors.textSoft },
  progressPts: { fontSize: 12, color: colors.textMuted },
  progressTrack: {
    height: 6,
    backgroundColor: "rgba(171,213,255,0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressPercent: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 5,
    textAlign: "right",
  },
  maxTierRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  maxTierText: {
    fontSize: 13,
    fontWeight: "600",
  },
  miniStatsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(171,213,255,0.04)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingVertical: 12,
  },
  miniStat: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  miniStatValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  miniStatLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  miniStatDivider: {
    width: 1,
    backgroundColor: colors.glassBorder,
    alignSelf: "stretch",
    marginVertical: 4,
  },

  // Tabs
  tabBar: {
    flexDirection: "row",
    backgroundColor: "rgba(20,28,45,0.6)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: 16,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 12,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.white,
  },

  // Section
  section: { gap: 10 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  emptySection: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptySectionText: {
    fontSize: 13,
    color: colors.textMuted,
  },

  // Reward card
  rewardCard: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  rewardCardLocked: {
    opacity: 0.6,
  },
  rewardCardInner: { padding: 16, gap: 12 },
  rewardCardTop: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  rewardCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(171,213,255,0.08)",
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rewardCardInfo: { flex: 1 },
  rewardName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 3,
  },
  rewardDesc: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
  rewardCardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rewardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  rewardPoints: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primaryLight,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textMuted,
    marginHorizontal: 2,
  },
  rewardTierLock: {
    fontSize: 11,
    color: colors.textMuted,
  },
  redeemBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.primary,
    minWidth: 80,
    alignItems: "center",
  },
  redeemBtnDisabled: {
    backgroundColor: "rgba(42,79,122,0.25)",
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  redeemBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.white,
  },

  // Tier card
  tierCard: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  tierCardCurrent: {
    borderColor: "rgba(171,213,255,0.3)",
  },
  tierCardInner: { padding: 16, gap: 10 },
  currentBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginBottom: 4,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tierCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tierIcon: { fontSize: 28 },
  tierCardHeaderText: { flex: 1 },
  tierName: {
    fontSize: 16,
    fontWeight: "700",
  },
  tierThreshold: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  tierBenefitsList: { gap: 6, paddingLeft: 4 },
  tierBenefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tierBenefitText: {
    fontSize: 12,
    color: colors.textSoft,
    flex: 1,
  },
  nextTierProgress: { gap: 6 },
  progressTrackSmall: {
    height: 4,
    backgroundColor: "rgba(171,213,255,0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFillSmall: {
    height: "100%",
    borderRadius: 2,
  },
  nextTierProgressText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "right",
  },

  // History
  rulesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  ruleChip: {
    backgroundColor: "rgba(20,28,45,0.7)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  rulePoints: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.accent,
  },
  ruleLabel: {
    fontSize: 11,
    color: colors.textSoft,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(20,28,45,0.6)",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  historyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  historyInfo: { flex: 1 },
  historyLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  historyDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  historyRight: { alignItems: "flex-end", gap: 2 },
  historyPoints: {
    fontSize: 16,
    fontWeight: "700",
  },
  historyDate: {
    fontSize: 10,
    color: colors.textMuted,
  },

  // Empty
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 14,
  },
  emptyStateIcon: { fontSize: 56 },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  emptyStateDesc: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
});