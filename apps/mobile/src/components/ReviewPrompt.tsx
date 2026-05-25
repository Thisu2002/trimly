// D:\trimly\apps\mobile\src\components\ReviewPrompt.tsx

import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { StarRow } from "./StarRow";
import { API_BASE_URL } from "../config/api";

const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Great",
  5: "Excellent!",
};

interface ReviewState {
  rating: number;
  comment: string;
  submitting: boolean;
  submitted: boolean;
  pointsEarned: number | null;
  tierChanged: boolean;
  newTierName: string | null;
  error: string | null;
}

export interface ReviewedResult {
  rating: number;
  comment: string | null;
  pointsEarned: number | null;
  tierChanged: boolean;
  newTierName: string | null;
}

interface Props {
  appointmentId: string;
  userSub: string;
  onReviewed: (result: ReviewedResult) => void;
}

export function ReviewPrompt({ appointmentId, userSub, onReviewed }: Props) {
  const [state, setState] = useState<ReviewState>({
    rating: 0,
    comment: "",
    submitting: false,
    submitted: false,
    pointsEarned: null,
    tierChanged: false,
    newTierName: null,
    error: null,
  });

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
    ]).start();
  }, []);

  async function submitReview() {
    if (state.rating === 0) {
      setState((s) => ({ ...s, error: "Please select a star rating" }));
      return;
    }
    setState((s) => ({ ...s, submitting: true, error: null }));

    try {
      const res = await fetch(`${API_BASE_URL}/api/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userSub,
          appointmentId,
          rating: state.rating,
          comment: state.comment.trim() || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setState((s) => ({ ...s, submitting: false, error: json.error ?? "Submission failed" }));
        return;
      }

      const payload: ReviewedResult = {
        rating: state.rating,
        comment: state.comment.trim() || null,
        pointsEarned: json.loyalty?.pointsAdded ?? null,
        tierChanged: json.loyalty?.tierChanged ?? false,
        newTierName: json.loyalty?.newTierName ?? null,
      };

      setState((s) => ({
        ...s,
        submitting: false,
        submitted: true,
        pointsEarned: payload.pointsEarned,
        tierChanged: payload.tierChanged,
        newTierName: payload.newTierName,
      }));

      setTimeout(() => onReviewed(payload), 2800);
    } catch {
      setState((s) => ({ ...s, submitting: false, error: "Network error, please try again" }));
    }
  }

  if (state.submitted) {
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.successWrapper}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.successTitle}>Thanks for your review!</Text>
          <StarRow rating={state.rating} size={18} readonly />
          {state.pointsEarned != null && (
            <View style={styles.pointsBadge}>
              <Ionicons name="flash" size={12} color={colors.success} />
              <Text style={styles.pointsBadgeText}>+{state.pointsEarned} pts earned</Text>
            </View>
          )}
          {state.tierChanged && state.newTierName && (
            <View style={styles.tierUpBadge}>
              <Ionicons name="trophy" size={12} color={colors.star} />
              <Text style={styles.tierUpText}>You reached {state.newTierName} tier!</Text>
            </View>
          )}
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{
            translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }),
          }],
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconWrap}>
          <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.primaryLight} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>How was your experience?</Text>
          <Text style={styles.headerSub}>
            <Ionicons name="flash-outline" size={11} color={colors.textMuted} />
            {" "}Earn loyalty points for leaving a review
          </Text>
        </View>
      </View>

      {/* Stars */}
      <View style={styles.starRow}>
        <StarRow
          rating={state.rating}
          size={30}
          onRate={(r) => setState((s) => ({ ...s, rating: r, error: null }))}
        />
        {state.rating > 0 && (
          <Text style={styles.ratingLabel}>{RATING_LABELS[state.rating]}</Text>
        )}
      </View>

      {/* Comment */}
      <TextInput
        style={styles.input}
        placeholder="Share your thoughts (optional)..."
        placeholderTextColor={colors.textMuted}
        value={state.comment}
        onChangeText={(t) => setState((s) => ({ ...s, comment: t }))}
        multiline
        numberOfLines={3}
        maxLength={400}
      />

      {state.error && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={13} color="#EF4444" />
          <Text style={styles.errorText}>{state.error}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.submitBtn, state.rating === 0 && styles.submitBtnDisabled]}
        onPress={submitReview}
        disabled={state.submitting || state.rating === 0}
        activeOpacity={0.75}
      >
        {state.submitting ? (
          <ActivityIndicator color={colors.white} size="small" />
        ) : (
          <>
            <Ionicons name="send" size={14} color={colors.white} />
            <Text style={styles.submitBtnText}>Submit Review</Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(30, 50, 85, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(171,213,255,0.18)",
    borderTopWidth: 0,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    padding: 16,
    paddingTop: 14,
    marginTop: -4,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  headerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(171,213,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(171,213,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  headerSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  starRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  ratingLabel: {
    fontSize: 13,
    color: colors.primaryLight,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 12,
    padding: 12,
    color: colors.text,
    fontSize: 13,
    minHeight: 68,
    textAlignVertical: "top",
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: "rgba(171,213,255,0.18)",
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 13,
  },
  // Success
  successWrapper: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  successEmoji: { fontSize: 30 },
  successTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(34,197,94,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.3)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  pointsBadgeText: {
    color: colors.success,
    fontWeight: "700",
    fontSize: 12,
  },
  tierUpBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(244,178,35,0.1)",
    borderWidth: 1,
    borderColor: "rgba(244,178,35,0.25)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tierUpText: {
    color: colors.star,
    fontWeight: "600",
    fontSize: 12,
  },
});