// src/screens/WrongPortalScreen.tsx
import { Pressable, StyleSheet, Text, View, Animated, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { auth0 } from "../lib/auth";
import { colors } from "../theme/colors";

type Props = { onLogout: () => void };

export default function WrongPortalScreen({ onLogout }: Props) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 600, useNativeDriver: true,
    }).start();

    // Float loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10, duration: 2500,
          easing: Easing.inOut(Easing.ease), useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0, duration: 2500,
          easing: Easing.inOut(Easing.ease), useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  async function handleLogout() {
    try {
      await auth0.webAuth.clearSession();
    } catch {}
    onLogout();
  }

  return (
    <LinearGradient
      colors={[colors.gradientLeft, colors.gradientRight]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 2, y: 0.5 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.safe}>
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>

          {/* Floating icon */}
          <Animated.View style={{ transform: [{ translateY: floatAnim }], marginBottom: 32 }}>
            <View style={styles.iconCircle}>
              <Ionicons name="phone-portrait-outline" size={48} color={colors.primaryLight} />
            </View>
          </Animated.View>

          {/* Card */}
          <View style={styles.card}>
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>WRONG PORTAL</Text>
            </View>

            <Text style={styles.title}>
              You're in the{"\n"}wrong place!
            </Text>

            <Text style={styles.subtitle}>
              This app is for Trimly customers only. Salon management lives at our web portal.
            </Text>

            {/* Feature pills */}
            <View style={styles.pillRow}>
              {["Manage bookings", "Staff scheduling", "Analytics", "Salon settings"].map((f) => (
                <View key={f} style={styles.pill}>
                  <View style={styles.pillDot} />
                  <Text style={styles.pillText}>{f}</Text>
                </View>
              ))}
            </View>

            <View style={styles.divider} />

            {/* Web portal hint */}
            <View style={styles.portalRow}>
              <Ionicons name="globe-outline" size={16} color={colors.textMuted} />
              <Text style={styles.portalText}>Visit{" "}
                <Text style={styles.portalLink}>trimly.app</Text>
                {" "}to manage your salon
              </Text>
            </View>

            {/* Logout */}
            <Pressable style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={17} color={colors.primaryLight} />
              <Text style={styles.logoutText}>Sign out</Text>
            </Pressable>
          </View>

        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: "rgba(171,213,255,0.08)",
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    backgroundColor: "rgba(10, 16, 28, 0.72)",
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(171,213,255,0.18)",
    alignItems: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(171,213,255,0.08)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primaryLight,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primaryLight,
    letterSpacing: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    lineHeight: 32,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 20,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    marginBottom: 20,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primaryLight,
  },
  pillText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: colors.glassBorder,
    marginBottom: 16,
  },
  portalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
  },
  portalText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  portalLink: {
    color: colors.primaryLight,
    fontWeight: "600",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(171,213,255,0.08)",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    width: "100%",
    justifyContent: "center",
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primaryLight,
  },
});