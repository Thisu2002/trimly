import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { auth0 } from "../lib/auth";
import { colors } from "../theme/colors";
import { AuthUser } from "../types/auth";

type Props = {
  user: AuthUser | null;
  onLogout: () => void;
};

export default function HomeScreen({ user, onLogout }: Props) {
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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.brand}>TRIMLY</Text>

        <View style={styles.hero}>
          <Text style={styles.welcome}>Hi{user?.name ? `, ${user.name}` : ""} ✨</Text>
          <Text style={styles.heroTitle}>Find your next salon appointment</Text>
          <Text style={styles.heroText}>
            This is the temporary consumer homepage. Later you can show nearby salons,
            categories, featured services, and bookings here.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick actions</Text>

          <View style={styles.grid}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Browse Salons</Text>
              <Text style={styles.cardText}>UI placeholder for salon list</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Book Service</Text>
              <Text style={styles.cardText}>UI placeholder for booking flow</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>My Appointments</Text>
              <Text style={styles.cardText}>UI placeholder for bookings history</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Profile</Text>
              <Text style={styles.cardText}>
                {user?.email ?? "User email will appear here"}
              </Text>
            </View>
          </View>
        </View>

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  brand: {
    color: colors.primaryLight,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 3,
    marginBottom: 16,
  },
  hero: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  welcome: {
    color: colors.primaryLight,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 10,
  },
  heroText: {
    color: colors.textSoft,
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 14,
  },
  grid: {
    gap: 12,
  },
  card: {
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 16,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  cardText: {
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 20,
  },
  logoutButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
});