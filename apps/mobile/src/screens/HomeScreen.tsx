import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { auth0 } from "../lib/auth";
import { colors } from "../theme/colors";
import { AuthUser } from "../types/auth";

type Props = {
  user: AuthUser | null;
  onLogout: () => void;
  onBrowseSalons: () => void;
};

export default function HomeScreen({ user, onLogout, onBrowseSalons }: Props) {
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
            <Text style={styles.header}>TRIMLY</Text>

            <View style={styles.hero}>
              <Text style={styles.heroTitle}>Hi{user?.name ? `, ${user.name}` : ""}</Text>
              <Text style={styles.heroText}>Find your next salon appointment.</Text>
            </View>

            <Pressable style={styles.primaryButton} onPress={onBrowseSalons}>
              <Text style={styles.primaryButtonText}>Browse Salons</Text>
            </Pressable>

            <View style={styles.grid}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>My Appointments</Text>
                <Text style={styles.cardText}>Coming next</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Profile</Text>
                <Text style={styles.cardText}>{user?.email ?? "-"}</Text>
              </View>
            </View>

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
  header: {
    fontSize: 18,
    color: colors.textSoft,
    marginBottom: 16,
  },
  hero: {
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.text,
  },
  heroText: {
    fontSize: 15,
    color: colors.textSoft,
    marginTop: 6,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  grid: {
    gap: 12,
    marginBottom: 20,
  },
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
  cardText: {
    fontSize: 14,
    color: colors.textSoft,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  logoutText: {
    color: colors.text,
    fontWeight: "700",
  },
});