import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { LinearGradient } from "expo-linear-gradient";

export default function PaymentSuccessScreen({ navigation }: any) {
  return (
    <LinearGradient
      colors={[colors.gradientLeft, colors.gradientRight]}
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Payment Successful 🎉</Text>
        <Text style={styles.subtitle}>
          Your appointment has been confirmed.
        </Text>

        <Pressable
          style={styles.button}
          onPress={() => navigation.popToTop()}
        >
          <Text style={styles.buttonText}>Go Home</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    color: colors.textSoft,
    marginTop: 8,
    textAlign: "center",
  },
  button: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  buttonText: {
    color: colors.white,
    fontWeight: "600",
  },
});