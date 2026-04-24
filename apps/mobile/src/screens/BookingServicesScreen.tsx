import { useEffect, useState } from "react";
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

const STEPS = ["Services", "Date & Time", "Stylist", "Confirm"];
const CURRENT_STEP = 0;

export default function BookingServicesScreen({ route, navigation }: Props) {
  const { salonId } = route.params;
  const [salon, setSalon] = useState<SalonDetail | null>(null);
  const [selected, setSelected] = useState<ServiceItem[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch(`${API_BASE_URL}/api/mobile/salons/${salonId}`);
      const data = await res.json();
      setSalon(data.salon);
    })();
  }, [salonId]);

  const total = selected.reduce((sum, s) => sum + s.priceLkr, 0);

  function isSelected(serviceId: string) {
    return selected.some((s) => s.id === serviceId);
  }

  function toggleService(service: ServiceItem) {
    setSelected((prev) => {
      const exists = prev.some((s) => s.id === service.id);
      if (exists) {
        return prev
          .filter((s) => s.id !== service.id)
          .map((s, index) => ({ ...s, sequence: index + 1 }));
      }
      return [...prev, { ...service, sequence: prev.length + 1 }];
    });
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const next = [...selected];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setSelected(next.map((s, i) => ({ ...s, sequence: i + 1 })));
  }

  function moveDown(index: number) {
    if (index === selected.length - 1) return;
    const next = [...selected];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    setSelected(next.map((s, i) => ({ ...s, sequence: i + 1 })));
  }

  if (!salon) return null;

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
            <Text style={styles.title}>{salon.name}</Text>
            <Text style={styles.meta}>{salon.address || "-"}</Text>
            <Text style={styles.openText}>Open till 18:00</Text>
            <Text style={styles.rating}>⭐⭐⭐⭐☆</Text>

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

            {salon.categories.map((category) => (
              <View key={category.id} style={{ marginBottom: 16 }}>
                <Text style={styles.sectionTitle}>{category.name}</Text>
                {category.services.map((service) => {
                  const active = isSelected(service.id);
                  return (
                    <Pressable
                      key={service.id}
                      style={[styles.item, active && styles.itemSelected]}
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
                      <Text style={styles.icon}>{active ? "✓" : "+"}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}

            <View style={styles.summary}>
              <Text style={styles.summaryHint}>Selected services order</Text>
              {selected.map((service, index) => (
                <View key={service.id} style={styles.summaryCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.summaryServiceTitle}>
                      {service.sequence}. {service.name}
                    </Text>
                    <Text style={styles.summaryPrice}>LKR {service.priceLkr}</Text>
                  </View>
                  <View style={styles.orderButtons}>
                    <Pressable style={styles.orderButton} onPress={() => moveUp(index)}>
                      <Text style={styles.orderButtonText}>↑</Text>
                    </Pressable>
                    <Pressable style={styles.orderButton} onPress={() => moveDown(index)}>
                      <Text style={styles.orderButtonText}>↓</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={{ fontWeight: "700", color: colors.text }}>Total</Text>
                <Text style={{ fontWeight: "700", color: colors.text }}>LKR {total}</Text>
              </View>
            </View>

            <Pressable
              disabled={!selected.length}
              style={[styles.continueButton, !selected.length && { opacity: 0.5 }]}
              onPress={() =>
                navigation.navigate("BookingDateTime", {
                  salonId,
                  salonName: salon.name,
                  selectedServices: selected,
                })
              }
            >
              <Text style={styles.continueButtonText}>Continue →</Text>
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
  meta: { color: colors.textSoft, marginTop: 4 },
  openText: { color: colors.accent, marginTop: 2 },
  rating: { color: colors.star, marginTop: 4, marginBottom: 20 },

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
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  itemSelected: {
    borderColor: colors.primaryLight,
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
  summaryCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.cardSoft,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  summaryServiceTitle: {
    color: colors.text,
    fontWeight: "700",
  },
  summaryPrice: {
    color: colors.textSoft,
    marginTop: 4,
  },
  orderButtons: { gap: 8 },
  orderButton: {
    backgroundColor: colors.chip,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  orderButtonText: { color: colors.text, fontWeight: "700" },
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
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
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