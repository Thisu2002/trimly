import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ImageBackground } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CompositeNavigationProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { auth0 } from "../lib/auth";
import { colors } from "../theme/colors";
import { AuthUser } from "../types/auth";
import { RootStackParamList, TabParamList  } from "../navigation/RootNavigator";

const { width } = Dimensions.get("window");

type Props = {
  user: AuthUser | null;
  idToken: string | null;
  onLogout: () => void;
  onBrowseSalons: () => void;
  onBrowseAppointments: () => void;
  onOpenLoyalty: () => void;
};
 
// HomeScreen lives inside the Tab navigator, but needs to push root stack screens.
// CompositeNavigationProp gives us both tab + stack methods.
type NavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "HomeTab">,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function HomeScreen({
  user,
  onLogout,
  onBrowseSalons,
  onBrowseAppointments,
  onOpenLoyalty,
}: Props) {
  const navigation = useNavigation<NavProp>();

  async function handleLogout() {
    try {
      await auth0.webAuth.clearSession();
      onLogout();
    } catch (error) {
      console.log("Logout error:", error);
      Alert.alert("Logout failed", "Could not log out properly.");
    }
  }

  const firstName = user?.name?.split(" ")[0] ?? "there";
  const insets = useSafeAreaInsets();
  const bottomPad = 62 + insets.bottom + 12;

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
              {/* FIX: real rewards button navigating to LoyaltyScreen */}
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
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 15 }}>
                <Text style={styles.greeting}>Good day,</Text>
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
              colors={["rgba(2,2,2,0.55)", "rgba(2,2,2,0.55)"]}
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
              <View style={[styles.quickIcon, { backgroundColor: "rgba(34,197,94,0.15)" }]}>
                <Ionicons name="calendar-outline" size={22} color={colors.accent} />
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
              <View style={[styles.quickIcon, { backgroundColor: "rgba(244,178,35,0.15)" }]}>
                <Ionicons name="sparkles-outline" size={22} color={colors.star} />
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

          {/* ── Section: AI Features ── */}
          <Text style={styles.sectionTitle}>AI Features</Text>

          {/* Virtual Mirror Card */}
          <Pressable
            style={styles.featureCard}
            onPress={() => navigation.navigate("Mirror", {})}
          >
            <LinearGradient
              colors={["rgba(20,28,45,0.9)", "rgba(30,42,70,0.7)"]}
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

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingTop: 8 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLogo: { width: 80, height: 80 },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  // Rewards button (FIX: replaces the broken <Text>Rewards Icon</Text>)
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
  rewardsBtnLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primaryLight,
  },

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

  // Hero Banner
  heroBanner: {
    borderRadius: 22,
    marginBottom: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.glassBorder,
    minHeight: 170,
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

  // Section Title
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 12,
  },

  // Quick Actions
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

  // Feature Cards
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
  featureEmoji: { fontSize: 26 },
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

  // Profile chip
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