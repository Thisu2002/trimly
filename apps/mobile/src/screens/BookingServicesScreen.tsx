import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { API_BASE_URL } from "../config/api";
import { SalonDetail, ServiceItem } from "../types/salon";
import { colors } from "../theme/colors";
import LoadingOverlay from "../components/LoadingOverlay";

type Props = NativeStackScreenProps<RootStackParamList, "BookingServices">;

const STEPS = ["Services", "Date & Time", "Stylist", "Confirm"];
const CURRENT_STEP = 0;

export default function BookingServicesScreen({ route, navigation }: Props) {
  const { salonId } = route.params;
  const [salon, setSalon] = useState<SalonDetail | null>(null);
  const [selected, setSelected] = useState<ServiceItem[]>([]);
  const insets = useSafeAreaInsets();

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

  if (!salon) return <LoadingOverlay />;

  return (
    <LinearGradient
      colors={[colors.gradientLeft, colors.gradientRight]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 2, y: 0.5 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.outer}>
          <View style={styles.page}>
            {/* ── Compact header (not scrollable) ── */}
            <View style={styles.header}>
              <Text style={styles.title} numberOfLines={1}>
                {salon.name}
              </Text>
              <View style={styles.headerMeta}>
                <Text style={styles.metaAddress} numberOfLines={1}>
                  {salon.address || "-"}
                </Text>
                <View style={styles.metaDot} />
                <Text style={styles.metaOpen}>Open till 18:00</Text>
              </View>
            </View>

            {/* ── Step progress (not scrollable) ── */}
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

            {/* ── Scrollable services list ── */}
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingBottom: 12 }}
            >
              {salon.categories.map((category) => (
                <View key={category.id} style={{ marginBottom: 14 }}>
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
                            {service.durationMin} min · LKR {service.priceLkr}
                          </Text>
                        </View>
                        <Text style={styles.icon}>{active ? "✓" : "+"}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </ScrollView>

            {/* ── Pinned bottom panel ── */}
            <View style={styles.pinnedPanel}>
              {selected.length > 0 && (
                <>
                  <Text style={styles.summaryHint}>Selected order</Text>
                  {selected.map((service, index) => (
                    <View key={service.id} style={styles.summaryCard}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={styles.summaryServiceTitle}
                          numberOfLines={1}
                        >
                          {service.sequence}. {service.name}
                        </Text>
                        <Text style={styles.summaryPrice}>
                          LKR {service.priceLkr}
                        </Text>
                      </View>
                      <View style={styles.orderButtons}>
                        <Pressable
                          style={styles.orderButton}
                          onPress={() => moveUp(index)}
                        >
                          <Text style={styles.orderButtonText}>↑</Text>
                        </Pressable>
                        <Pressable
                          style={styles.orderButton}
                          onPress={() => moveDown(index)}
                        >
                          <Text style={styles.orderButtonText}>↓</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </>
              )}

              <View style={styles.totalAndContinue}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>LKR {total}</Text>
                </View>
                <Pressable
                  disabled={!selected.length}
                  style={[
                    styles.continueButton,
                    !selected.length && { opacity: 0.5 },
                  ]}
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
            </View>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    padding: 12,
    paddingBottom: 62 + 16,
  },
  page: {
    flex: 1,
    backgroundColor: colors.page,
    borderRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 18,
    paddingBottom: 0,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: "hidden",
  },

  // ── Compact header ──
  header: {
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  headerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaAddress: {
    color: colors.textSoft,
    fontSize: 12,
    flex: 1,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
  },
  metaOpen: {
    color: colors.accent,
    fontSize: 12,
  },

  // ── Step progress ──
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
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
    marginBottom: 4,
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

  // ── Service list ──
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  item: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 11,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  itemSelected: {
    borderColor: colors.primaryLight,
  },
  itemTitle: { fontWeight: "700", color: colors.text, fontSize: 13 },
  itemDesc: { fontSize: 11, color: colors.textSoft, marginTop: 2 },
  itemMeta: { fontSize: 11, color: colors.textSoft, marginTop: 2 },
  icon: { fontSize: 18, fontWeight: "700", color: colors.text },

  // ── Pinned panel ──
  pinnedPanel: {
    backgroundColor: "rgba(6, 12, 22, 0.95)",
    borderTopWidth: 1,
    borderTopColor: colors.primary,
    paddingTop: 10,
    paddingBottom: 10,
    marginHorizontal: -18,
    paddingHorizontal: 18,
  },
  summaryHint: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  summaryCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  summaryServiceTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 12,
  },
  summaryPrice: {
    color: colors.textSoft,
    fontSize: 11,
    marginTop: 2,
  },
  orderButtons: { flexDirection: "row", gap: 6 },
  orderButton: {
    backgroundColor: colors.chip,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  orderButtonText: { color: colors.text, fontWeight: "700", fontSize: 13 },

  totalAndContinue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 3,
  },
  totalRow: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  continueButton: {
    flex: 2,
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: "center",
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
