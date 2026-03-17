import { Alert, Button, StyleSheet, Text, View } from "react-native";
import { auth0 } from "./src/lib/auth";

export default function App() {
  async function handleLogin() {
    try {
      // const credentials = await auth0.webAuth.authorize(
      //   { scope: "openid profile email" },
      //   { customScheme: "trimly" },
      // );

      const credentials = await auth0.webAuth.authorize({
  scope: "openid profile email",
});

      console.log("Logged in:", credentials);
      Alert.alert("Login success", "Auth0 returned credentials successfully.");
    } catch (error) {
      console.log("Login error:", error);
      Alert.alert("Login failed", "Check console for the error.");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trimly Mobile</Text>
      <Text style={styles.subtitle}>Auth0 test screen</Text>

      <View style={styles.buttonWrap}>
        <Button title="Login with Auth0" onPress={handleLogin} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "#94a3b8",
    marginBottom: 30,
  },
  buttonWrap: {
    width: 220,
  },
});
