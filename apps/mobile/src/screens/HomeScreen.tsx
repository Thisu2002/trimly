import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  Dimensions,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ImageBackground } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CompositeNavigationProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { auth0 } from "../lib/auth";
import { colors } from "../theme/colors";
import { AuthUser } from "../types/auth";
import { RootStackParamList, TabParamList } from "../navigation/RootNavigator";
import { API_BASE_URL } from "../config/api";

const { width } = Dimensions.get("window");

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  user: AuthUser | null;
  idToken: string | null;
  onLogout: () => void;
  onBrowseSalons: () => void;
  onBrowseAppointments: () => void;
  onOpenLoyalty: () => void;
};

type NavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "HomeTab">,
  NativeStackNavigationProp<RootStackParamList>
>;

type TrendingStyle = {
  id: string;
  name: string;
  category: string;
  coverImageUrl: string;
  tag: string;
  serviceCount: number;
};

// ─── Tag color mapping ────────────────────────────────────────────────────────

function tagColor(tag: string): string {
  if (tag === "Most Popular") return colors.star;
  if (tag === "Trending")     return colors.accent;
  return colors.primaryLight;
}

// ─── Trending card ────────────────────────────────────────────────────────────

const CARD_W = width * 0.38;
const CARD_H = CARD_W * 1.35;

function TrendingCard({ item }: { item: TrendingStyle }) {
  const tc = tagColor(item.tag);
  return (
    <View style={trend.card}>
      <ImageBackground
        source={{ uri: item.coverImageUrl }}
        style={trend.image}
        imageStyle={trend.imageStyle}
        resizeMode="cover"
      >
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.78)"]}
          style={trend.overlay}
        >
          <View style={[trend.tagBadge, { borderColor: tc }]}>
            <Text style={[trend.tagText, { color: tc }]}>{item.tag}</Text>
          </View>
          <Text style={trend.name} numberOfLines={2}>{item.name}</Text>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

// ─── Trending skeleton (shown while loading) ──────────────────────────────────

function TrendingSkeleton() {
  return (
    <View style={[trend.card, trend.skeleton]}>
      <View style={trend.skeletonShimmer} />
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function HomeScreen({
  user,
  onLogout,
  onBrowseSalons,
  onBrowseAppointments,
  onOpenLoyalty,
}: Props) {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const bottomPad = 62 + insets.bottom + 12;
  const firstName = user?.name?.split(" ")[0] ?? "there";

  // ── Trending styles state ──────────────────────────────────────────────────
  const [trendingStyles, setTrendingStyles] = useState<TrendingStyle[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);

  useEffect(() => {
    fetchTrendingStyles();
  }, []);

  async function fetchTrendingStyles() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/trending-styles?limit=6`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setTrendingStyles(data.styles ?? []);
    } catch (err) {
      console.warn("[HomeScreen] trending styles fetch failed:", err);
      // Silently fail — section just won't render
      setTrendingStyles([]);
    } finally {
      setTrendingLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await auth0.webAuth.clearSession();
      onLogout();
    } catch (error) {
      console.log("Logout error:", error);
      Alert.alert("Logout failed", "Could not log out properly.");
    }
  }

  return (
    <LinearGradient
      colors={[colors.gradientLeft, colors.gradientRight]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 2, y: 0.5 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <Image
              source={require("../../assets/logo_cropped.png")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View style={styles.headerRight}>
              <Pressable onPress={onOpenLoyalty} style={styles.rewardsBtn}>
                <LinearGradient
                  colors={["rgba(42,79,122,0.6)", "rgba(0,59,143,0.4)"]}
                  style={styles.rewardsBtnInner}
                >
                  <Ionicons name="gift-outline" size={18} color={colors.primaryLight} />
                  <Text style={styles.rewardsBtnLabel}>Rewards</Text>
                </LinearGradient>
              </Pressable>

              <Pressable onPress={handleLogout} style={styles.avatarBtn}>
                <LinearGradient
                  colors={["rgba(42,79,122,0.8)", "rgba(0,59,143,0.6)"]}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarLetter}>
                    {(user?.name ?? "U")[0].toUpperCase()}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>

          {/* ── Greeting ── */}
          <View style={styles.greetingRow}>
            <Text style={styles.greeting}>Good day, </Text>
            <Text style={styles.userName}>{firstName}!</Text>
          </View>

          {/* ── Hero Banner ── */}
          <ImageBackground
            source={require("../../assets/hero_banner.jpg")}
            style={styles.heroBanner}
            imageStyle={styles.heroBannerImage}
            resizeMode="cover"
          >
            <LinearGradient
              colors={["rgba(2,2,2,0.45)", "rgba(0,30,80,0.72)"]}
              style={styles.heroBannerOverlay}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.heroBannerInner}>
                <View style={styles.heroTextBlock}>
                  <Text style={styles.heroBannerTag}>✦ BOOK NOW</Text>
                  <Text style={styles.heroBannerTitle}>
                    Find your{"\n"}perfect look
                  </Text>
                  <Text style={styles.heroBannerSub}>
                    Discover top salons near you
                  </Text>
                </View>
              </View>

              <Pressable style={styles.heroCTA} onPress={onBrowseSalons}>
                <Text style={styles.heroCTAText}>Browse Salons</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.white} />
              </Pressable>
            </LinearGradient>
          </ImageBackground>

          {/* ── Section: Quick Actions ── */}
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickRow}>
            <Pressable style={styles.quickCard} onPress={onBrowseAppointments}>
              <View style={[styles.quickIcon, { backgroundColor: "rgba(171,213,255,0.12)" }]}>
                <Ionicons name="calendar-outline" size={22} color={colors.primaryLight} />
              </View>
              <Text style={styles.quickLabel}>My{"\n"}Bookings</Text>
            </Pressable>

            <Pressable
              style={styles.quickCard}
              onPress={() => navigation.navigate("SalonList")}
            >
              <View style={[styles.quickIcon, { backgroundColor: "rgba(171,213,255,0.12)" }]}>
                <Ionicons name="cut-outline" size={22} color={colors.primaryLight} />
              </View>
              <Text style={styles.quickLabel}>Salons{"\n"}Nearby</Text>
            </Pressable>

            <Pressable
              style={styles.quickCard}
              onPress={() => navigation.navigate("StyleRecommendation")}
            >
              <View style={[styles.quickIcon, { backgroundColor: "rgba(171,213,255,0.12)" }]}>
                <Ionicons name="sparkles-outline" size={22} color={colors.primaryLight} />
              </View>
              <Text style={styles.quickLabel}>Style{"\n"}Tips</Text>
            </Pressable>

            <Pressable
              style={styles.quickCard}
              onPress={() => navigation.navigate("Mirror", {})}
            >
              <View style={[styles.quickIcon, { backgroundColor: "rgba(171,213,255,0.08)" }]}>
                <Ionicons name="camera-outline" size={22} color={colors.primaryLight} />
              </View>
              <Text style={styles.quickLabel}>Virtual{"\n"}Mirror</Text>
            </Pressable>
          </View>

          {/* ── Section: Trending Styles (live from DB) ── */}
          {(trendingLoading || trendingStyles.length > 0) && (
            <>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Trending Styles</Text>
                  <Text style={styles.sectionSub}>What's popular this season</Text>
                </View>
                <Pressable
                  style={styles.seeAllBtn}
                  onPress={() => navigation.navigate("StyleRecommendation")}
                >
                  <Text style={styles.seeAllText}>See all</Text>
                  <Ionicons name="chevron-forward" size={13} color={colors.primaryLight} />
                </Pressable>
              </View>

              {trendingLoading ? (
                // Skeleton shimmer while loading
                <FlatList
                  data={[1, 2, 3]}
                  keyExtractor={(item) => String(item)}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  scrollEnabled={false}
                  contentContainerStyle={styles.trendList}
                  ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
                  renderItem={() => <TrendingSkeleton />}
                  style={styles.trendScroll}
                />
              ) : (
                <FlatList
                  data={trendingStyles}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.trendList}
                  ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
                  renderItem={({ item }) => <TrendingCard item={item} />}
                  nestedScrollEnabled
                  style={styles.trendScroll}
                />
              )}
            </>
          )}

          {/* ── Section: AI Features ── */}
          <Text style={[styles.sectionTitle, { marginTop: 28 }]}>AI Features</Text>

          {/* Virtual Mirror Card */}
          <Pressable
            style={styles.featureCard}
            onPress={() => navigation.navigate("Mirror", {})}
          >
            <LinearGradient
              colors={["rgba(20,28,45,0.9)", "rgba(50, 110, 249, 0.7)"]}
              style={styles.featureCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.featureCardLeft}>
                <View style={[styles.featureIconCircle, { backgroundColor: "rgba(171,213,255,0.1)" }]}>
                  <Ionicons name="camera-outline" size={30} color={colors.primaryLight} />
                </View>
                <View style={styles.featureCardText}>
                  <Text style={styles.featureCardTitle}>Virtual Mirror</Text>
                  <Text style={styles.featureCardSub}>
                    Detect your face shape & try{"\n"}hairstyles live in AR
                  </Text>
                </View>
              </View>
              <View style={styles.featureArrowWrap}>
                <Ionicons name="chevron-forward" size={18} color={colors.primaryLight} />
              </View>
            </LinearGradient>
          </Pressable>

          {/* Style Recommendation Card */}
          <Pressable
            style={styles.featureCardAccent}
            onPress={() => navigation.navigate("StyleRecommendation")}
          >
            <LinearGradient
              colors={["#2a4f7a", "#003B8F"]}
              style={styles.featureCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.featureCardLeft}>
                <View style={[styles.featureIconCircle, { backgroundColor: "rgba(255,255,255,0.12)" }]}>
                  <Ionicons name="sparkles-outline" size={30} color={colors.primaryLight} />
                </View>
                <View style={styles.featureCardText}>
                  <Text style={[styles.featureCardTitle, { color: colors.white }]}>
                    Style Recommendations
                  </Text>
                  <Text style={[styles.featureCardSub, { color: "rgba(255,255,255,0.7)" }]}>
                    AI picks based on your{"\n"}saved hair profile
                  </Text>
                </View>
              </View>
              <View style={[styles.featureArrowWrap, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
                <Ionicons name="chevron-forward" size={18} color={colors.white} />
              </View>
            </LinearGradient>
          </Pressable>

          {/* ── Profile chip at bottom ── */}
          <View style={styles.profileChip}>
            <Ionicons name="person-circle-outline" size={18} color={colors.textMuted} />
            <Text style={styles.profileChipText} numberOfLines={1}>
              {user?.email ?? "—"}
            </Text>
            <Pressable onPress={handleLogout} style={styles.logoutChipBtn}>
              <Text style={styles.logoutChipText}>Log out</Text>
            </Pressable>
          </View>

          {/* Bottom padding for tab bar + Android nav bar */}
          <View style={{ height: bottomPad }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Trending card styles ─────────────────────────────────────────────────────
const trend = StyleSheet.create({
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  image: { width: "100%", height: "100%" },
  imageStyle: { borderRadius: 18 },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 12,
    gap: 6,
  },
  tagBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  tagText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  name: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.white,
    lineHeight: 17,
  },
  // Skeleton
  skeleton: {
    backgroundColor: "rgba(20,28,45,0.7)",
  },
  skeletonShimmer: {
    flex: 1,
    backgroundColor: "rgba(171,213,255,0.04)",
  },
});

// ─── Screen-level styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingTop: 8 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLogo: { width: 80, height: 80 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },

  rewardsBtn: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  rewardsBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  rewardsBtnLabel: { fontSize: 12, fontWeight: "600", color: colors.primaryLight },

  greetingRow: { flexDirection: "row", marginBottom: 15 },
  greeting: {
    fontSize: 15,
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  userName: {
    fontSize: 15,
    fontWeight: "500",
    textTransform: "uppercase",
    color: colors.text,
  },

  avatarBtn: { padding: 2 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  avatarLetter: { fontSize: 18, fontWeight: "700", color: colors.white },

  heroBanner: {
    borderRadius: 22,
    marginBottom: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.glassBorder,
    minHeight: 185,
  },
  heroBannerImage: { borderRadius: 22 },
  heroBannerOverlay: { padding: 20, flex: 1 },
  heroBannerInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  heroTextBlock: { flex: 1 },
  heroBannerTag: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primaryLight,
    letterSpacing: 2,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  heroBannerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.text,
    lineHeight: 32,
    marginBottom: 8,
  },
  heroBannerSub: { fontSize: 13, color: colors.textSoft },
  heroCTA: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    alignSelf: "flex-start",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 30,
    gap: 6,
  },
  heroCTAText: { color: colors.white, fontWeight: "700", fontSize: 14 },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 14,
    opacity: 0.7,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingTop: 2,
  },
  seeAllText: { fontSize: 12, fontWeight: "600", color: colors.primaryLight },

  quickRow: { flexDirection: "row", gap: 10, marginBottom: 28 },
  quickCard: {
    flex: 1,
    backgroundColor: "rgba(20,28,45,0.6)",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.glassBorder,
    gap: 8,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textSoft,
    textAlign: "center",
    lineHeight: 14,
  },

  trendScroll: { marginHorizontal: -18 },
  trendList: {
    paddingLeft: 18,
    paddingRight: 18,
    paddingVertical: 4,
  },

  featureCard: {
    borderRadius: 20,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  featureCardAccent: {
    borderRadius: 20,
    marginBottom: 20,
    overflow: "hidden",
  },
  featureCardGradient: { padding: 18, flexDirection: "row", alignItems: "center" },
  featureCardLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 14 },
  featureIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  featureCardText: { flex: 1 },
  featureCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  featureCardSub: { fontSize: 12, color: colors.textSoft, lineHeight: 17 },
  featureArrowWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(171,213,255,0.08)",
  },

  profileChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(20,28,45,0.5)",
    borderRadius: 30,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  profileChipText: { flex: 1, fontSize: 12, color: colors.textMuted },
  logoutChipBtn: {
    backgroundColor: "rgba(171,213,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  logoutChipText: { fontSize: 12, fontWeight: "600", color: colors.primaryLight },
});