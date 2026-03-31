import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { RootStackParamList } from "../navigation/RootNavigator";
import { colors } from "../theme/colors";
import { HairProfile, MatchedService, Recommendation } from "../types/salon";
import { API_BASE_URL } from "../config/api";

type Props = NativeStackScreenProps<RootStackParamList, "StyleRecommendation">& {
  userSub: string | undefined;
};

const SCORE_MAX = 11;
const MAX_SALONS = 5;
const MAX_SERVICES_PER_SALON = 5;

type SalonGroup = {
  salonId: string;
  salonName: string;
  salonAddress?: string | null;
  services: MatchedService[];
};

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min((score / SCORE_MAX) * 100, 100);
  return (
    <View style={styles.scoreBarTrack}>
      <View style={[styles.scoreBarFill, { width: `${pct}%` }]} />
    </View>
  );
}

function groupBySalon(services: MatchedService[]): SalonGroup[] {
  const map = new Map<string, SalonGroup>();
  for (const svc of services) {
    const { id, name, address } = svc.salon;
    if (!map.has(id)) {
      map.set(id, { salonId: id, salonName: name, salonAddress: address, services: [] });
    }
    const group = map.get(id)!;
    if (group.services.length < MAX_SERVICES_PER_SALON) {
      group.services.push(svc);
    }
  }
  return Array.from(map.values()).slice(0, MAX_SALONS);
}

export default function StyleRecommendationScreen({ navigation, userSub }: Props) {
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [profile, setProfile]               = useState<HairProfile | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [matchedServices, setMatchedServices] = useState<MatchedService[]>([]);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    setError(null);
    try {
      const profileRes = await fetch(`${API_BASE_URL}/api/hair-profile/${userSub}`);

      if (profileRes.status === 404) {
        navigation.replace("Mirror");
        return;
      }

      if (!profileRes.ok) throw new Error(`Profile fetch failed: ${profileRes.status}`);

      const savedProfile: HairProfile = await profileRes.json();
      setProfile(savedProfile);

      const recRes = await fetch(`${API_BASE_URL}/recommendation/style`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          faceShape:        savedProfile.faceShape,
          hairType:         savedProfile.hairType,
          hairLength:       savedProfile.hairLength,
          styleGoal:        savedProfile.styleGoal,
          previousServices: savedProfile.previousServices ?? [],
        }),
      });

      if (!recRes.ok) throw new Error(`Recommendation fetch failed: ${recRes.status}`);

      const data = await recRes.json();
      setRecommendations(data.ai?.recommendations ?? []);
      setMatchedServices(data.matchedServices ?? []);
    } catch (err: any) {
      console.error(err);
      setError("Could not load recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function servicesForRec(rec: Recommendation): MatchedService[] {
    return matchedServices.filter((svc) =>
      rec.recommendedStyles.some(
        (s) => s.toLowerCase() === (svc.style?.name ?? "").toLowerCase(),
      ),
    );
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <LinearGradient
        colors={[colors.gradientLeft, colors.gradientRight]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 2, y: 0.5 }}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={styles.safe}>
          <View style={styles.centred}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Finding your best styles…</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <LinearGradient
        colors={[colors.gradientLeft, colors.gradientRight]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 2, y: 0.5 }}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={styles.safe}>
          <View style={styles.centred}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={fetchAll}>
              <Text style={styles.retryBtnText}>Try again</Text>
            </Pressable>
            <Pressable onPress={() => navigation.goBack()} style={styles.backBtnCentred}>
              <Text style={styles.backText}>← Go back</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── Results ─────────────────────────────────────────────────────────────────
  return (
    <LinearGradient
      colors={[colors.gradientLeft, colors.gradientRight]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 2, y: 0.5 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.page}>
            <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </Pressable>

            <Text style={styles.heading}>Style Recommendations</Text>

            {profile && (
              <View style={styles.profileRow}>
                <View style={styles.profilePill}>
                  <Text style={styles.profilePillText}>
                    {profile.faceShape} face · {profile.hairType} · {profile.hairLength} ·{" "}
                    {profile.styleGoal.replace("_", " ")}
                  </Text>
                </View>
                {/* Let user update their profile via Mirror */}
                <Pressable
                  onPress={() => navigation.navigate("Mirror")}
                  style={styles.editProfileBtn}
                >
                  <Text style={styles.editProfileText}>Edit profile</Text>
                </Pressable>
              </View>
            )}

            {recommendations.length === 0 && (
              <Text style={styles.empty}>
                No recommendations found for your profile. Try updating it.
              </Text>
            )}

            {recommendations.map((rec, idx) => {
              const recServices = servicesForRec(rec);
              const salonGroups = groupBySalon(recServices);

              return (
                <View key={rec.id} style={styles.recCard}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>#{idx + 1}</Text>
                  </View>

                  <Text style={styles.recName}>{rec.name}</Text>
                  <Text style={styles.recDesc}>{rec.description}</Text>

                  <View style={styles.scoreRow}>
                    <Text style={styles.scoreLabel}>Match score</Text>
                    <Text style={styles.scoreValue}>{rec.score}/{SCORE_MAX}</Text>
                  </View>
                  <ScoreBar score={rec.score} />

                  {rec.reasons.length > 0 && (
                    <View style={styles.reasonsWrap}>
                      {rec.reasons.map((r, i) => (
                        <View key={i} style={styles.reasonChip}>
                          <Text style={styles.reasonText}>✓ {r}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {salonGroups.length > 0 ? (
                    <View style={styles.salonsSection}>
                      <Text style={styles.salonsSectionTitle}>
                        Available at {salonGroups.length} salon{salonGroups.length !== 1 ? "s" : ""}
                      </Text>

                      {salonGroups.map((group, gIdx) => (
                        <Pressable
                          key={group.salonId}
                          style={({ pressed }) => [
                            styles.salonRow,
                            pressed && styles.salonRowPressed,
                          ]}
                          onPress={() =>
                            navigation.navigate("SalonDetail", { salonId: group.salonId })
                          }
                        >
                          <View style={styles.salonAccent} />
                          <View style={styles.salonLeft}>
                            <View style={styles.salonNameRow}>
                              <View style={styles.salonIndexBadge}>
                                <Text style={styles.salonIndexText}>{gIdx + 1}</Text>
                              </View>
                              <Text style={styles.salonName} numberOfLines={1}>
                                {group.salonName}
                              </Text>
                            </View>
                            {group.salonAddress ? (
                              <Text style={styles.salonAddress} numberOfLines={2}>
                                📍 {group.salonAddress}
                              </Text>
                            ) : null}
                            <View style={styles.servicePills}>
                              {group.services.map((svc) => (
                                <View key={svc.id} style={styles.servicePill}>
                                  <Text style={styles.servicePillText}>{svc.name}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                          <Text style={styles.salonArrow}>›</Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.noServices}>
                      No services currently available for this style.
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  page: {
    backgroundColor: colors.page,
    borderRadius: 24,
    padding: 18,
    minHeight: "100%",
  },
  centred: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  loadingText: { marginTop: 14, fontSize: 14, color: colors.textSoft },
  errorText: { fontSize: 15, color: colors.text, textAlign: "center", marginBottom: 20 },
  retryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginBottom: 12,
  },
  retryBtnText: { color: colors.white, fontWeight: "700" },
  backBtnCentred: { marginTop: 4 },
  backBtn: { marginBottom: 16 },
  backText: { color: colors.primary, fontWeight: "700", fontSize: 15 },
  heading: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 12,
  },

  // Profile row
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
    flexWrap: "wrap",
  },
  profilePill: {
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  profilePillText: {
    fontSize: 12,
    color: colors.textSoft,
    textTransform: "capitalize",
  },
  editProfileBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editProfileText: { fontSize: 12, color: colors.primary, fontWeight: "700" },

  empty: { color: colors.textSoft, fontSize: 14, textAlign: "center", marginTop: 40 },

  // Recommendation card
  recCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
  },
  rankBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  rankText: { color: colors.white, fontWeight: "800", fontSize: 12 },
  recName: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 6,
    paddingRight: 44,
  },
  recDesc: { fontSize: 13, color: colors.textSoft, lineHeight: 19, marginBottom: 14 },

  scoreRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  scoreLabel: { fontSize: 12, color: colors.textSoft },
  scoreValue: { fontSize: 12, fontWeight: "700", color: colors.primary },
  scoreBarTrack: {
    height: 5,
    backgroundColor: colors.border,
    borderRadius: 3,
    marginBottom: 14,
    overflow: "hidden",
  },
  scoreBarFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 3 },

  reasonsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 16 },
  reasonChip: {
    backgroundColor: colors.page,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  reasonText: { fontSize: 11, color: colors.textSoft },

  salonsSection: { marginTop: 4 },
  salonsSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 10,
  },
  salonRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.page,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  salonRowPressed: { opacity: 0.75, borderColor: colors.primary },
  salonAccent: {
    width: 4,
    alignSelf: "stretch",
    backgroundColor: colors.primary,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  salonLeft: { flex: 1, padding: 12, marginRight: 4 },
  salonNameRow: { flexDirection: "row", alignItems: "center", marginBottom: 4, gap: 8 },
  salonIndexBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  salonIndexText: { fontSize: 11, fontWeight: "800", color: colors.white },
  salonName: { fontSize: 14, fontWeight: "700", color: colors.text, flex: 1 },
  salonAddress: { fontSize: 12, color: colors.textSoft, marginBottom: 8, marginLeft: 28 },
  servicePills: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginLeft: 28 },
  servicePill: {
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  servicePillText: { fontSize: 11, color: colors.textSoft },
  salonArrow: { fontSize: 24, color: colors.primary, fontWeight: "300", paddingRight: 14 },
  noServices: { fontSize: 12, color: colors.textSoft, marginTop: 8, fontStyle: "italic" },
});