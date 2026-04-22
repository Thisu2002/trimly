import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { auth0 } from "../lib/auth";
import { colors } from "../theme/colors";
import { AuthUser } from "../types/auth";
import { RootStackParamList } from "../navigation/RootNavigator";

type Props = {
  user: AuthUser | null;
  idToken: string | null;
  onLogout: () => void;
  onBrowseSalons: () => void;
  onBrowseAppointments: () => void;
};

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen({
  user,
  onLogout,
  onBrowseSalons,
  onBrowseAppointments,
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
            <Image
              source={require("../../assets/logo_cropped.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.hero}>
              <Text style={styles.heroTitle}>
                Hi{user?.name ? `, ${user.name}` : ""}
              </Text>
              <Text style={styles.heroText}>
                Find your next salon appointment.
              </Text>
            </View>

            <Pressable style={styles.primaryButton} onPress={onBrowseSalons}>
              <Text style={styles.primaryButtonText}>Browse Salons</Text>
            </Pressable>

            <View style={styles.grid}>
              <Pressable style={styles.card} onPress={onBrowseAppointments}>
                <Text style={styles.cardTitle}>My Appointments</Text>
                <Text style={styles.cardText}>View history</Text>
              </Pressable>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Profile</Text>
                <Text style={styles.cardText}>{user?.email ?? "-"}</Text>
              </View>
            </View>

            {/* Mirror CTA — opens camera + AR hair try-on */}
            <Pressable
              style={styles.mirrorCard}
//               onPress={() => navigation.navigate("VirtualTryOn", {  photos: {
//   front: "http://localhost:4000/uploads/test-front.jpg",
//   left:  "http://localhost:4000/uploads/test-left.jpg",
//   right: "http://localhost:4000/uploads/test-right.jpg",~
// }, faceShape: "oval", landmarks: [] })}
onPress={() => navigation.navigate("Mirror")}
            >
              <View style={styles.featureTextWrap}>
                <Text style={styles.featureEmoji}>🪞</Text>
                <View>
                  <Text style={styles.featureTitle}>Virtual Mirror</Text>
                  <Text style={styles.featureSub}>
                    Try hairstyles live — we'll detect your face shape & recommend styles
                  </Text>
                </View>
              </View>
              <Text style={styles.featureArrow}>›</Text>
            </Pressable>

            {/* Recommendation CTA — goes straight to results using saved profile */}
            <Pressable
              style={styles.recommendCard}
              onPress={() => navigation.navigate("StyleRecommendation")}
            >
              <View style={styles.featureTextWrap}>
                <Text style={styles.featureEmoji}>✨</Text>
                <View style={styles.featureTextInner}>
                  <Text style={styles.featureTitle}>Style Recommendations</Text>
                  <Text style={styles.featureSub}>
                    Based on your saved hair profile
                  </Text>
                </View>
              </View>
              <Text style={styles.featureArrow}>›</Text>
            </Pressable>

            <Pressable style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16 },
  page: {
    backgroundColor: colors.page,
    borderRadius: 24,
    padding: 18,
    minHeight: "100%",
  },
  logo: { width: 150, height: 150 },
  hero: { marginBottom: 20 },
  heroTitle: { fontSize: 30, fontWeight: "800", color: colors.text },
  heroText: { fontSize: 15, color: colors.textSoft, marginTop: 6 },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  primaryButtonText: { color: colors.white, fontSize: 16, fontWeight: "700" },
  grid: { gap: 12, marginBottom: 20 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  cardText: { fontSize: 14, color: colors.textSoft },

  // Mirror card — distinct accent colour to feel special
  mirrorCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
  },
  recommendCard: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  featureTextWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
    gap: 12,
  },
  featureTextInner: { flex: 1 },
  featureEmoji: { fontSize: 28 },
  featureTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 3,
  },
  featureSub: { fontSize: 12, color: colors.textSoft },
  featureArrow: { fontSize: 22, color: colors.primary, fontWeight: "700" },
  logoutButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  logoutText: { color: colors.text, fontWeight: "700" },
});