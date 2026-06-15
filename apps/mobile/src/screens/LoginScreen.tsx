//D:\trimly\apps\mobile\src\screens\LoginScreen.tsx
import { useState, useEffect, useRef } from "react";
import LoadingOverlay from "../components/LoadingOverlay";
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { jwtDecode } from "jwt-decode";
import { webAuth0Login } from "../lib/auth";
import { colors } from "../theme/colors";
import { AuthUser } from "../types/auth";
import { LinearGradient } from "expo-linear-gradient";
import { API_BASE_URL } from "../config/api";

type Props = {
  onLoginSuccess: (user: AuthUser, idToken: string, isNewUser: boolean) => void;
};

type IdTokenPayload = {
  sub?: string;
  name?: string;
  email?: string;
  picture?: string;
};

export default function LoginScreen({ onLoginSuccess }: Props) {
  const [isLoading, setIsLoading] = useState(false);
async function handleLogin() {
  try {
    setIsLoading(true);
    const { idToken } = await webAuth0Login();

    if (!idToken) return;

    const decoded = jwtDecode<IdTokenPayload>(idToken);

    const res = await fetch(`${API_BASE_URL}/api/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to sync user");

    onLoginSuccess(
      {
        name: data.user.name,
        email: decoded.email,
        picture: decoded.picture,
        sub: decoded.sub,
        role: data.user.role,
      },
      idToken,
      data.isNewUser,
    );
  } catch (error) {
    console.log("Login error:", error);
    Alert.alert("Login failed", "Could not complete login.");
    setIsLoading(false);
  }
}

  function ShineOverlay() {
    const translateX = useRef(new Animated.Value(-220)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),

        Animated.timing(translateX, {
          toValue: 220,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),

        Animated.timing(opacity, {
          toValue: 0,
          duration: 60,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    return (
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 220,
          height: 220,
          overflow: "hidden",
          opacity,
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={[
            "rgba(255,255,255,0)",
            "rgba(171,213,255,0.35)",
            "rgba(255,255,255,0)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            width: 70,
            height: 220,
            transform: [{ skewX: "-20deg" }],
          }}
        />
      </Animated.View>
    );
  }

  if (isLoading) return <LoadingOverlay />;

  return (
    <LinearGradient
      colors={[colors.gradientLeft, colors.gradientRight]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 2, y: 0.5 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topSection}>
          <View style={{ position: "relative" }}>
            <Image
              source={require("../../assets/trimly_logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <ShineOverlay />
          </View>
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.card}>
            <Text style={styles.welcome}>Welcome 💫</Text>
            <Text style={styles.title}>Your style, your way.</Text>
            <Text style={styles.subtitle}>
              Discover salons, book appointments, and look your best.
            </Text>

            <Pressable style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>Get Started</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  topSection: {
    flex: 1.2,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  bottomSection: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  logo: {
    width: 220,
    height: 220,
  },
  card: {
    backgroundColor: "rgba(10, 16, 28, 0.72070)",
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(171, 213, 255, 0.18)",
  },
  welcome: {
    color: "#ABD5FF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  subtitle: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#2A4F7A",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: "#ABD5FF",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
