import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import PayHere from "@payhere/payhere-mobilesdk-reactnative";
import { API_BASE_URL } from "../config/api";
import { colors } from "../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "BookingSummary"> & {
  idToken: string;
};

const STEPS = ["Services", "Date & Time", "Stylist", "Confirm"];
const CURRENT_STEP = 3;

export default function BookingSummaryScreen({ route, navigation, idToken }: Props) {
  const { salonId, salonName, date, startTime, selectedServices, selectedStylists } =
    route.params;

  const total = selectedServices.reduce((sum, s) => sum + s.priceLkr, 0);

  function pollPaymentStatus(pendingPaymentId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const MAX_ATTEMPTS = 20;
      const interval = setInterval(async () => {
        attempts++;
        try {
          const res = await fetch(
            `${API_BASE_URL}/api/mobile/payment-status/${pendingPaymentId}`
          );
          const data = await res.json();
          if (data.status === "confirmed") {
            clearInterval(interval);
            resolve(data.appointmentId);
          } else if (data.status === "failed") {
            clearInterval(interval);
            reject(new Error("Payment was not completed."));
          } else if (attempts >= MAX_ATTEMPTS) {
            clearInterval(interval);
            reject(new Error("Payment confirmation timed out. Please contact support if you were charged."));
          }
        } catch (e) {
          if (attempts >= MAX_ATTEMPTS) {
            clearInterval(interval);
            reject(e);
          }
        }
      }, 2000);
    });
  }

  async function handleConfirm() {
    try {
      const serviceAssignments = selectedServices.map((service) => ({
        serviceId: service.id,
        stylistId: selectedStylists[service.id].id,
        sequence: service.sequence!,
      }));

      const res = await fetch(`${API_BASE_URL}/api/mobile/initiate-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, salonId, date, startTime, serviceAssignments }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment init failed");

      const { pendingPaymentId, paymentData } = data;

      PayHere.startPayment(
        paymentData,
        async (_paymentId: string) => {
          try {
            const appointmentId = await pollPaymentStatus(pendingPaymentId);
            navigation.navigate("PaymentSuccess", { appointmentId });
          } catch (pollError: any) {
            Alert.alert("Checking Payment", pollError?.message || "We couldn't confirm your payment yet.");
          }
        },
        (error: string) => Alert.alert("Payment Error", error),
        () => console.log("Payment dismissed by user")
      );
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Something went wrong");
    }
  }

  return (
    <LinearGradient
      colors={[colors.gradientLeft, colors.gradientRight]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 2, y: 0.5 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.outer}>
          <View style={styles.page}>
            <Text style={styles.title}>{salonName}</Text>
            <Text style={styles.meta}>{date} · {startTime}</Text>

            {/* Step Progress */}
            <View style={styles.stepRow}>
              {STEPS.map((step, i) => {
                const isCompleted = i < CURRENT_STEP;
                const isActive = i === CURRENT_STEP;
                return (
                  <View key={step} style={styles.stepItem}>
                    {i > 0 && (
                      <View
                        style={[
                          styles.stepLine,
                          (isCompleted || isActive) && styles.stepLineActive,
                        ]}
                      />
                    )}
                    <View
                      style={[
                        styles.stepDot,
                        isCompleted && styles.stepDotCompleted,
                        isActive && styles.stepDotActive,
                      ]}
                    >
                      {/* {isCompleted && <Text style={styles.stepCheck}>✓</Text>} */}
                      {isActive && <View style={styles.stepDotInner} />}
                    </View>
                    <Text
                      style={[
                        styles.stepLabel,
                        isActive && styles.stepLabelActive,
                        isCompleted && styles.stepLabelCompleted,
                      ]}
                    >
                      {step}
                    </Text>
                  </View>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>Summary</Text>
            {selectedServices.map((service) => (
              <View key={service.id} style={styles.summaryRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.stylistName}>
                    with {selectedStylists[service.id]?.name}
                  </Text>
                </View>
                <Text style={styles.price}>LKR {service.priceLkr}</Text>
              </View>
            ))}

            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalText}>Total</Text>
              <Text style={styles.totalText}>LKR {total}</Text>
            </View>

            <Pressable style={styles.continueButton} onPress={handleConfirm}>
              <Text style={styles.continueButtonText}>Confirm & Pay →</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  outer: { padding: 12 },
  page: {
    backgroundColor: colors.page,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  title: { fontSize: 28, fontWeight: "800", color: colors.text },
  meta: { color: colors.textSoft, marginTop: 4, marginBottom: 20 },

  // Step progress
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  stepItem: {
    flex: 1,
    alignItems: "center",
    position: "relative",
  },
  stepLine: {
    position: "absolute",
    top: 9,
    right: "50%",
    left: "-50%",
    height: 2,
    backgroundColor: colors.glassBorder,
    zIndex: 0,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.glassBorder,
    backgroundColor: colors.page,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    marginBottom: 6,
  },
  stepDotActive: {
    borderColor: colors.primary,
  },
  stepDotCompleted: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  stepDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  stepCheck: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "800",
  },
  stepLabel: {
    fontSize: 10,
    color: colors.textSoft,
    textAlign: "center",
  },
  stepLabelActive: {
    color: colors.text,
    fontWeight: "700",
  },
  stepLabelCompleted: {
    color: colors.primary,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
    gap: 12,
  },
  serviceName: { fontWeight: "700", color: colors.text },
  stylistName: { color: colors.textSoft, marginTop: 4 },
  price: { color: colors.text },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  totalText: {
    fontWeight: "800",
    fontSize: 16,
    color: colors.text,
  },
  continueButton: {
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  continueButtonText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.3,
  },
});