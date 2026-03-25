import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { jwtDecode } from "jwt-decode";
import { auth0 } from "../lib/auth";
import { colors } from "../theme/colors";
import { AuthUser } from "../types/auth";
import { LinearGradient } from "expo-linear-gradient";
import { API_BASE_URL } from "../config/api";

type Props = {
  onLoginSuccess: (user: AuthUser, idToken: string) => void;
};

type IdTokenPayload = {
  sub?: string;
  name?: string;
  email?: string;
  picture?: string;
};

export default function LoginScreen({ onLoginSuccess }: Props) {
  async function handleLogin() {
    try {
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

      if (!res.ok) {
        throw new Error(data.error || "Failed to sync user");
      }

      onLoginSuccess(
        {
          name: decoded.name,
          email: decoded.email,
          picture: decoded.picture,
          sub: decoded.sub,
        },
        credentials.idToken
      );
    } catch (error) {
      console.log("Login error:", error);
      Alert.alert("Login failed", "Could not complete login.");
    }
  }

  return (
    <LinearGradient
      colors={[colors.gradientLeft, colors.gradientRight]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 2, y: 0.5 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topSection}>
          <Image
            source={require("../../assets/trimly_logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.card}>
            <Text style={styles.welcome}>Welcome 💫</Text>
            <Text style={styles.title}>Consumer App</Text>
            <Text style={styles.subtitle}>
              Book salon services, choose stylists, and manage appointments
              easily.
            </Text>

            <Pressable style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>Login with Auth0</Text>
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