import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { API_BASE_URL } from "../config/api";
import { SalonDetail, ServiceItem } from "../types/salon";
import { colors } from "../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "BookingServices">;

export default function BookingServicesScreen({ route, navigation }: Props) {
  const { salonId } = route.params;
  const [salon, setSalon] = useState<SalonDetail | null>(null);
  const [selected, setSelected] = useState<Record<string, ServiceItem>>({});

  useEffect(() => {
    (async () => {
      const res = await fetch(`${API_BASE_URL}/api/mobile/salons/${salonId}`);
      const data = await res.json();
      setSalon(data.salon);
    })();
  }, [salonId]);

  const selectedServices = useMemo(() => Object.values(selected), [selected]);
  const total = selectedServices.reduce((sum, s) => sum + s.priceLkr, 0);

  function toggleService(service: ServiceItem) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[service.id]) {
        delete next[service.id];
      } else {
        next[service.id] = service;
      }
      return next;
    });
  }

  if (!salon) return null;

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
            <Text style={styles.title}>{salon.name}</Text>
            <Text style={styles.meta}>{salon.address || "-"}</Text>
            <Text style={styles.openText}>Open till 18:00</Text>
            <Text style={styles.rating}>⭐⭐⭐⭐☆</Text>

            <View style={styles.progressRow}>
              <Text style={styles.progressActive}>Services</Text>
              <Text style={styles.progress}>Date & Time</Text>
              <Text style={styles.progress}>Stylist</Text>
              <Text style={styles.progress}>Confirm</Text>
            </View>

            {salon.categories.map((category) => (
              <View key={category.id} style={{ marginBottom: 16 }}>
                <Text style={styles.sectionTitle}>{category.name}</Text>
                {category.services.map((service) => {
                  const isSelected = !!selected[service.id];

                  return (
                    <Pressable
                      key={service.id}
                      style={[styles.item, isSelected && styles.itemSelected]}
                      onPress={() => toggleService(service)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{service.name}</Text>
                        <Text style={styles.itemDesc}>
                          {service.description || "Professional service"}
                        </Text>
                        <Text style={styles.itemMeta}>
                          {service.durationMin} min | LKR {service.priceLkr}
                        </Text>
                      </View>
                      <Text style={styles.icon}>{isSelected ? "✓" : "+"}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}

            <View style={styles.summary}>
              <Text style={styles.summaryHint}>Your services will appear here...</Text>
              {selectedServices.map((service) => (
                <View key={service.id} style={styles.summaryRow}>
                  <Text>{service.name}</Text>
                  <Text>LKR {service.priceLkr}</Text>
                </View>
              ))}
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={{ fontWeight: "700" }}>Total</Text>
                <Text style={{ fontWeight: "700" }}>LKR {total}</Text>
              </View>
            </View>

            <Pressable
              disabled={!selectedServices.length}
              style={[
                styles.continueButton,
                !selectedServices.length && { opacity: 0.5 },
              ]}
              onPress={() =>
                navigation.navigate("BookingDateTime", {
                  salonId,
                  salonName: salon.name,
                  selectedServices,
                })
              }
            >
              <Text style={styles.continueButtonText}>Continue</Text>
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
  openText: { color: colors.accent, marginTop: 2 },
  rating: { color: colors.star, marginTop: 4, marginBottom: 12 },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  progressActive: { color: colors.text, fontWeight: "700" },
  progress: { color: colors.textSoft, fontSize: 12 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    color: colors.text,
  },
  item: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  itemSelected: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  itemTitle: { fontWeight: "700", color: colors.text },
  itemDesc: { fontSize: 12, color: colors.textSoft, marginTop: 4 },
  itemMeta: { fontSize: 12, color: colors.textSoft, marginTop: 4 },
  icon: { fontSize: 18, fontWeight: "700", color: colors.text },
  summary: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 12,
    paddingTop: 14,
  },
  summaryHint: {
    fontStyle: "italic",
    color: colors.textSoft,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 6,
  },
  continueButton: {
    alignSelf: "flex-end",
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 10,
    marginTop: 12,
  },
  continueButtonText: {
    color: colors.text,
    fontWeight: "600",
  },
});