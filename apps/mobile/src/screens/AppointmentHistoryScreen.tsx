// D:\trimly\apps\mobile\src\screens\AppointmentHistoryScreen.tsx

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useEffect, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { API_BASE_URL } from "../config/api";
import { AppointmentHistoryItem } from "../types/appointment";
import { AuthUser } from "../types/auth";
import { AppointmentCard } from "../components/AppointmentCard";
import { ReviewedResult } from "../components/ReviewPrompt";

type Props = { user: AuthUser | null };
type Filter = "all" | "upcoming" | "completed" | "cancelled";

interface ReviewedMap {
  [appointmentId: string]: { rating: number; comment: string | null } | undefined;
}

const FILTERS: { key: Filter; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "all",       label: "All",       icon: "list-outline"             },
  { key: "upcoming",  label: "Upcoming",  icon: "time-outline"             },
  { key: "completed", label: "Completed", icon: "checkmark-circle-outline" },
  { key: "cancelled", label: "Cancelled", icon: "close-circle-outline"     },
];

export default function AppointmentHistoryScreen({ user }: Props) {
  const [data, setData]               = useState<AppointmentHistoryItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [reviewedMap, setReviewedMap] = useState<ReviewedMap>({});
  const [filter, setFilter]           = useState<Filter>("all");

  const userSub = user?.sub ?? "";

  useEffect(() => { fetchAppointments(); }, []);

  async function fetchAppointments() {
    try {
      const res  = await fetch(`${API_BASE_URL}/api/appointment/list/${userSub}`);
      const json: AppointmentHistoryItem[] = await res.json();
      setData(json);

      const completedIds = json.filter((a) => a.status === "completed").map((a) => a.id);
      if (completedIds.length > 0) fetchReviewedMap(completedIds);
    } catch (err) {
      console.log("Fetch appointments error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchReviewedMap(appointmentIds: string[]) {
    try {
      const res  = await fetch(`${API_BASE_URL}/api/review/batch-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentIds }),
      });
      const json = await res.json();
      setReviewedMap(json.reviewed ?? {});
    } catch { /* non-fatal */ }
  }

  function handleReviewed(appointmentId: string, result: ReviewedResult) {
    setReviewedMap((prev) => ({
      ...prev,
      [appointmentId]: { rating: result.rating, comment: result.comment },
    }));
  }

  const filtered = useMemo(() => {
    if (filter === "all")      return data;
    if (filter === "upcoming") return data.filter((a) => a.status === "pending" || a.status === "confirmed");
    return data.filter((a) => a.status === filter);
  }, [data, filter]);

  const counts = useMemo(() => ({
    all:       data.length,
    upcoming:  data.filter((a) => a.status === "pending" || a.status === "confirmed").length,
    completed: data.filter((a) => a.status === "completed").length,
    cancelled: data.filter((a) => a.status === "cancelled").length,
  }), [data]);

  return (
    <LinearGradient
      colors={[colors.gradientLeft, colors.gradientRight]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 2, y: 0.5 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.safe}>

        {/* ── Page Header ── */}
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageTitle}>My Appointments</Text>
            <Text style={styles.pageSubtitle}>
              {data.length} {data.length === 1 ? "appointment" : "appointments"} total
            </Text>
          </View>
          <Pressable onPress={fetchAppointments} style={styles.refreshBtn}>
            <Ionicons name="refresh" size={17} color={colors.primaryLight} />
          </Pressable>
        </View>

        {/* ── Filter Bar ── */}
        <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {FILTERS.map((f) => {
            const active = filter === f.key;
            const count  = counts[f.key];
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Ionicons
                  name={f.icon}
                  size={13}
                  color={active ? colors.white : colors.textMuted}
                />
                <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>
                  {f.label}
                </Text>
                {count > 0 && (
                  <View style={[styles.filterBadge, active && styles.filterBadgeActive]}>
                    <Text style={[styles.filterBadgeText, active && styles.filterBadgeTextActive]}>
                      {count}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
        </View>

        {/* ── Content ── */}
        {loading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator color={colors.primaryLight} size="small" />
            <Text style={styles.loadingText}>Loading appointments…</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyWrapper}>
            <Ionicons name="calendar-outline" size={48} color={colors.textMuted} style={{ opacity: 0.4 }} />
            <Text style={styles.emptyTitle}>
              {data.length === 0 ? "No appointments yet" : `No ${filter} appointments`}
            </Text>
            <Text style={styles.emptyText}>
              {data.length === 0
                ? "Your appointment history will appear here."
                : "Try a different filter to see other appointments."}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <AppointmentCard
                item={item}
                userSub={userSub}
                existingReview={reviewedMap[item.id]}
                onReviewed={(result) => handleReviewed(item.id, result)}
              />
            )}
            contentContainerStyle={{ paddingBottom: 48 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  pageHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(171,213,255,0.07)",
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  filterWrapper: {
    height: 48,
    marginBottom: 14,
  },
  filterContent: { gap: 8, paddingRight: 4 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: "rgba(20,28,45,0.55)",
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: "rgba(171,213,255,0.3)",
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
  filterLabelActive: { color: colors.white },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(171,213,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  filterBadgeActive: { backgroundColor: "rgba(255,255,255,0.2)" },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
  },
  filterBadgeTextActive: { color: colors.white },
  loadingWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  emptyWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingBottom: 60,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    maxWidth: 260,
  },
});