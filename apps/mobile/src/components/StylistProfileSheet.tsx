import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "../config/api";
import { colors } from "../theme/colors";

interface StylistProfile {
  id: string;
  name: string;
  photo: string | null;
  bio: string | null;
  yearsOfExperience: number | null;
  services: { id: string; name: string }[];
  rating: number | null;
  reviewCount: number;
}

interface Props {
  stylistId: string | null;
  onClose: () => void;
}

export default function StylistProfileSheet({ stylistId, onClose }: Props) {
  const [profile, setProfile] = useState<StylistProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!stylistId) {
      translateY.setValue(0);
      return;
    }
    setProfile(null);
    setLoading(true);
    fetch(`${API_BASE_URL}/api/mobile/stylists/${stylistId}/profile`)
      .then((r) => r.json())
      .then((data) => setProfile(data.stylist))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [stylistId]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 80) {
          Animated.timing(translateY, {
            toValue: 600,
            duration: 220,
            useNativeDriver: true,
          }).start(onClose);
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  return (
    <Modal
      visible={!!stylistId}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + 16 },
          { transform: [{ translateY }] },
        ]}
      >
        {/* drag handle — pan responder lives here */}
        <View {...panResponder.panHandlers} style={styles.handleArea}>
          <View style={styles.handle} />
        </View>

        {loading || !profile ? (
          <ActivityIndicator
            size="small"
            color={colors.primaryLight}
            style={{ marginVertical: 40 }}
          />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* header */}
            <View style={styles.header}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={24} color={colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{profile.name}</Text>
                {profile.yearsOfExperience != null && (
                  <View style={styles.expRow}>
                    <Ionicons
                      name="briefcase-outline"
                      size={12}
                      color={colors.textMuted}
                    />
                    <Text style={styles.expText}>
                      {profile.yearsOfExperience} yr
                      {profile.yearsOfExperience !== 1 ? "s" : ""} experience
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* rating pill */}
            {profile.rating != null && (
              <View style={styles.ratingCard}>
                <View style={styles.ratingLeft}>
                  <Text style={styles.ratingNumber}>{profile.rating}</Text>
                  <Text style={styles.ratingMax}>/5</Text>
                </View>
                <View style={styles.ratingMid}>
                  <StarRating rating={profile.rating} />
                  <Text style={styles.reviewCount}>
                    {profile.reviewCount} review
                    {profile.reviewCount !== 1 ? "s" : ""}
                  </Text>
                </View>
                <Ionicons
                  name="star"
                  size={28}
                  color="rgba(244,178,35,0.15)"
                  style={{ marginLeft: "auto" }}
                />
              </View>
            )}

            {/* bio */}
            {profile.bio && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="information-circle-outline"
                    size={14}
                    color={colors.primaryLight}
                  />
                  <Text style={styles.sectionLabel}>About</Text>
                </View>
                <Text style={styles.bio}>{profile.bio}</Text>
              </View>
            )}

            {/* services */}
            {profile.services.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="cut-outline"
                    size={14}
                    color={colors.primaryLight}
                  />
                  <Text style={styles.sectionLabel}>Services</Text>
                </View>
                <View style={styles.chips}>
                  {profile.services.map((s) => (
                    <View key={s.id} style={styles.chip}>
                      <Text style={styles.chipText}>{s.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </Animated.View>
    </Modal>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= Math.round(rating) ? "star" : "star-outline"}
          size={13}
          color={colors.star}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.glassBorder,
    paddingHorizontal: 20,
    paddingTop: 0,
    maxHeight: "72%",
  },
  handleArea: {
    alignItems: "center",
    paddingTop: 14,
    paddingBottom: 10,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  expRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  expText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  ratingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 14,
    overflow: "hidden",
  },
  ratingLeft: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  ratingNumber: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
  },
  ratingMax: {
    fontSize: 13,
    color: colors.textMuted,
  },
  ratingMid: {
    gap: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: colors.textMuted,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    color: colors.primaryLight,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "600",
  },
  bio: {
    fontSize: 14,
    color: colors.textSoft,
    lineHeight: 21,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: "rgba(42, 79, 122, 0.45)",
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "rgba(171, 213, 255, 0.2)",
    paddingVertical: 5,
    paddingHorizontal: 13,
  },
  chipText: {
    fontSize: 12,
    color: colors.primaryLight,
    fontWeight: "500",
  },
});