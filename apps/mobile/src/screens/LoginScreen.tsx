import {
  Alert,
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
        //prompt: "login",
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
      end={{ x: 3, y: 0.5 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.brand}>TRIMLY</Text>
          <Text style={styles.title}>Consumer App</Text>
          <Text style={styles.subtitle}>
            Book salon services and manage appointments easily.
          </Text>

          <Pressable style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login with Auth0</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: colors.page,
    borderRadius: 24,
    padding: 24,
  },
  brand: {
    color: colors.textSoft,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 3,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 10,
  },
  subtitle: {
    color: colors.textSoft,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
});