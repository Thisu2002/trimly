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
import { auth0 } from "../lib/auth";
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
      const credentials = await auth0.webAuth.authorize({
        scope: "openid profile email",
      });

      const decoded = jwtDecode<IdTokenPayload>(credentials.idToken);

      const res = await fetch(`${API_BASE_URL}/api/auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idToken: credentials.idToken,
        }),
      });

      const data = await res.json();

      console.log("Is new user?", data.isNewUser);

      if (!res.ok) {
        throw new Error(data.error || "Failed to sync user");
      }

      onLoginSuccess(
        {
          name: data.user.name,
          email: decoded.email,
          picture: decoded.picture,
          sub: decoded.sub,
        },
        credentials.idToken,
        data.isNewUser
      );
    } catch (error) {
      console.log("Login error:", error);
      Alert.alert("Login failed", "Could not complete login.");
      setIsLoading(false);
    }
  }

  function ShineOverlay() {
    const translateX = useRef(new Animated.Value(-220)).current;

    useEffect(() => {
      Animated.timing(translateX, {
        toValue: 220,
        duration: 900,
        delay: 400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
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
          transform: [{ translateX }],
        }}
      >
        <View
          style={{
            width: 60,
            height: 220,
            backgroundColor: "#abd5ff",
            opacity: 0.18,
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
