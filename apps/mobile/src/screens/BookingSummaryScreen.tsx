import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { API_BASE_URL } from "../config/api";
import { colors } from "../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "BookingSummary"> & {
  idToken: string;
};

export default function BookingSummaryScreen({
  route,
  navigation,
  idToken,
}: Props) {
  const {
    salonId,
    salonName,
    date,
    startTime,
    selectedServices,
    selectedStylists,
  } = route.params;

  const total = selectedServices.reduce((sum, s) => sum + s.priceLkr, 0);

  async function handleConfirm() {
    try {
      const serviceAssignments = selectedServices.map((service) => ({
        serviceId: service.id,
        stylistId: selectedStylists[service.id].id,
      }));

      const res = await fetch(`${API_BASE_URL}/api/mobile/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idToken,
          salonId,
          date,
          startTime,
          serviceAssignments,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Booking failed");
      }

      Alert.alert("Success", "Appointment created successfully.", [
        {
          text: "OK",
          onPress: () => navigation.popToTop(),
        },
      ]);
    } catch (error: any) {
      console.log(error);
      Alert.alert("Booking failed", error?.message || "Could not create appointment.");
    }
  }

  return (
    <LinearGradient
      colors={[colors.gradientLeft, colors.gradientRight]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 3, y: 0.5 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.outer}>
          <View style={styles.page}>
            <Text style={styles.title}>{salonName}</Text>
            <Text style={styles.meta}>{date}</Text>
            <Text style={styles.meta}>{startTime}</Text>

            <View style={styles.progressRow}>
              <Text style={styles.progress}>Services</Text>
              <Text style={styles.progress}>Date & Time</Text>
              <Text style={styles.progress}>Stylist</Text>
              <Text style={styles.progressActive}>Confirm</Text>
            </View>

            <Text style={styles.sectionTitle}>Summary</Text>
            {selectedServices.map((service) => (
              <View key={service.id} style={styles.summaryRow}>
                <View>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.stylistName}>
                    with {selectedStylists[service.id]?.name}
                  </Text>
                </View>
                <Text style={styles.price}>LKR {service.priceLkr}</Text>
              </View>
            ))}

            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalText}>Total</Text>
              <Text style={styles.totalText}>LKR {total}</Text>
            </View>

            <Pressable style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>Continue</Text>
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
  },
  title: { fontSize: 34, fontWeight: "800", color: colors.text },
  meta: { color: colors.textSoft, marginTop: 4 },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20,
  },
  progressActive: { color: colors.text, fontWeight: "700" },
  progress: { color: colors.textSoft, fontSize: 12 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 12,
  },
  serviceName: {
    fontWeight: "700",
    color: colors.text,
  },
  stylistName: {
    color: colors.textSoft,
    marginTop: 4,
  },
  price: {
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },
  totalText: {
    fontWeight: "800",
    fontSize: 16,
    color: colors.text,
  },
  confirmButton: {
    alignSelf: "flex-end",
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 10,
    marginTop: 8,
  },
  confirmButtonText: {
    color: colors.text,
    fontWeight: "600",
  },
});