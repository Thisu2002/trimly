import { jwtDecode } from "jwt-decode";
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { auth0 } from "../lib/auth";
import { colors } from "../theme/colors";
import { AuthUser } from "../types/auth";

type Props = {
  onLoginSuccess: (user: AuthUser) => void;
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

      const res = await fetch("http://192.168.1.5:4000/api/auth", {
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

      onLoginSuccess({
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture,
        sub: decoded.sub,
      });
    } catch (error) {
      console.log("Login error:", error);
      Alert.alert("Login failed", "Could not complete login.");
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.brand}>TRIMLY</Text>
        <Text style={styles.title}>Consumer App</Text>
        <Text style={styles.subtitle}>
          Book salon services, manage appointments, and explore styles.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardText}>
            Sign in to continue to your consumer home.
          </Text>

          <Pressable style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login with Auth0</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  brand: {
    color: colors.primaryLight,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 3,
    marginBottom: 12,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSoft,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 20,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  cardText: {
    color: colors.textSoft,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
});