import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { LinearGradient } from "expo-linear-gradient";

export default function PaymentSuccessScreen({ navigation }: any) {
  return (
    <LinearGradient
          colors={[colors.gradientLeft, colors.gradientRight]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 2, y: 0.5 }}
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
      <View style={styles.card}>
        <Text style={styles.title}>Payment Successful!</Text>
        <Text style={styles.subtitle}>
          Your appointment has been confirmed.
        </Text>

        <Pressable
          style={styles.button}
          onPress={() =>
            navigation.reset({
              index: 0,
              routes: [{ name: "AppointmentsTab" }],
            })
          }
        >
          <Text style={styles.buttonText}>View My Bookings</Text>
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
