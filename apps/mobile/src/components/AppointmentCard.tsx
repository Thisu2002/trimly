// D:\trimly\apps\mobile\src\components\AppointmentCard.tsx

import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { AppointmentHistoryItem } from "../types/appointment";
import { StarRow } from "./StarRow";
import { ReviewPrompt, ReviewedResult } from "./ReviewPrompt";

interface ReviewedEntry {
  rating: number;
  comment: string | null;
}

interface Props {
  item: AppointmentHistoryItem;
  userSub: string;
  existingReview: ReviewedEntry | undefined;
  onReviewed: (result: ReviewedResult) => void;
}

const STATUS_CONFIG: Record<
  string,
  { color: string; icon: keyof typeof Ionicons.glyphMap; bg: string }
> = {
  completed: { color: colors.success,      icon: "checkmark-circle",  bg: "rgba(34,197,94,0.1)"   },
  confirmed: { color: colors.primaryLight,  icon: "time",              bg: "rgba(171,213,255,0.1)" },
  pending:   { color: colors.star,          icon: "hourglass-outline", bg: "rgba(244,178,35,0.1)"  },
  cancelled: { color: "#EF4444",            icon: "close-circle",      bg: "rgba(239,68,68,0.1)"   },
};

export function AppointmentCard({ item, userSub, existingReview, onReviewed }: Props) {
  const status = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
  const isCompleted = item.status === "completed";
  const hasBeenReviewed = existingReview !== undefined;

  const dateStr = new Date(item.date).toLocaleDateString("en-LK", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>

        {/* ── Salon + Status ── */}
        <View style={styles.cardHeader}>
          <View style={styles.salonIconWrap}>
            <Ionicons name="cut" size={15} color={colors.primaryLight} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.salonName} numberOfLines={1}>{item.salonName}</Text>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={11} color={colors.textMuted} />
              <Text style={styles.dateText}>{dateStr}</Text>
              <View style={styles.dateDot} />
              <Ionicons name="time-outline" size={11} color={colors.textMuted} />
              <Text style={styles.dateText}>{item.startTime} – {item.endTime}</Text>
            </View>
          </View>
          <View style={[styles.statusChip, { backgroundColor: status.bg }]}>
            <Ionicons name={status.icon} size={11} color={status.color} />
            <Text style={[styles.statusLabel, { color: status.color }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── Services ── */}
        <View style={styles.servicesSection}>
          {item.services.map((s, i) => (
            <View key={i} style={styles.serviceRow}>
              <View style={styles.serviceLeft}>
                <Ionicons name="sparkles-outline" size={12} color={colors.primaryLight} style={{ marginTop: 1 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceName}>{s.name}</Text>
                  <View style={styles.stylistRow}>
                    <Ionicons name="person-outline" size={10} color={colors.textMuted} />
                    <Text style={styles.stylistName}>{s.stylist}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.servicePrice}>LKR {s.priceLkr.toLocaleString()}</Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        {/* ── Total ── */}
        <View style={styles.cardFooter}>
          <View style={styles.footerLeft}>
            <Ionicons name="receipt-outline" size={13} color={colors.textMuted} />
            <Text style={styles.totalLabel}>Total</Text>
          </View>
          <Text style={styles.totalAmount}>LKR {item.totalLkr.toLocaleString()}</Text>
        </View>

        {/* ── Reviewed Badge ── */}
        {isCompleted && hasBeenReviewed && existingReview && (
          <View style={styles.reviewedSection}>
            <View style={styles.reviewedHeader}>
              <Ionicons name="star" size={12} color={colors.star} />
              <Text style={styles.reviewedLabel}>Your review</Text>
            </View>
            <StarRow rating={existingReview.rating} size={14} readonly />
            {existingReview.comment ? (
              <Text style={styles.reviewedComment} numberOfLines={2}>
                "{existingReview.comment}"
              </Text>
            ) : null}
          </View>
        )}
      </View>

      {/* ── Review Prompt (connected below card) ── */}
      {isCompleted && !hasBeenReviewed && (
        <ReviewPrompt
          appointmentId={item.id}
          userSub={userSub}
          onReviewed={onReviewed}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },

  // Header
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 12,
  },
  salonIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "rgba(171,213,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(171,213,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  salonName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
    flexWrap: "wrap",
  },
  dateText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  dateDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textMuted,
    opacity: 0.5,
    marginHorizontal: 2,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
    flexShrink: 0,
  },
  statusLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },

  // Services
  servicesSection: {
    gap: 9,
  },
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  serviceLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    flex: 1,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  stylistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  stylistName: {
    fontSize: 11,
    color: colors.textMuted,
  },
  servicePrice: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSoft,
    flexShrink: 0,
  },

  // Footer
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  totalLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "500",
  },
  totalAmount: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.primaryLight,
  },

  // Reviewed
  reviewedSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 6,
  },
  reviewedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  reviewedLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  reviewedComment: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: "italic",
    lineHeight: 17,
  },
});