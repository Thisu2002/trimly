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
import { SlotItem } from "../types/salon";
import { colors } from "../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "BookingDateTime">;

const STEPS = ["Services", "Date & Time", "Stylist", "Confirm"];
const CURRENT_STEP = 1; // 0-indexed

function next7Days() {
  const result: { iso: string; label: string; day: string }[] = [];
  const d = new Date();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  for (let i = 0; i < 7; i++) {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    result.push({
      iso: x.toISOString().slice(0, 10),
      day: i === 0 ? "Today" : dayNames[x.getDay()],
      label: `${x.getDate()} ${monthNames[x.getMonth()]}`,
    });
  }

  return result;
}

export default function BookingDateTimeScreen({ route, navigation }: Props) {
  const { salonId, salonName, selectedServices } = route.params;
  const dates = useMemo(() => next7Days(), []);
  const [selectedDate, setSelectedDate] = useState(dates[0].iso);
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  async function fetchSlots(date: string) {
    const res = await fetch(`${API_BASE_URL}/api/mobile/slots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salonId, date }),
    });
    const data = await res.json();
    setSlots(data.slots || []);
    setSelectedSlot(null);
  }

  useEffect(() => {
    fetchSlots(selectedDate);
  }, [selectedDate]);

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

            {/* Header */}
            <Text style={styles.title}>{salonName}</Text>
            <Text style={styles.progressHint}>Choose date and time</Text>

            {/* Step Progress */}
            <View style={styles.stepRow}>
              {STEPS.map((step, i) => {
                const isCompleted = i < CURRENT_STEP;
                const isActive = i === CURRENT_STEP;
                return (
                  <View key={step} style={styles.stepItem}>
                    {/* Connector line before */}
                    {i > 0 && (
                      <View
                        style={[
                          styles.stepLine,
                          isCompleted || isActive ? styles.stepLineActive : null,
                        ]}
                      />
                    )}
                    {/* Dot */}
                    <View
                      style={[
                        styles.stepDot,
                        isCompleted && styles.stepDotCompleted,
                        isActive && styles.stepDotActive,
                      ]}
                    >
                      {/* {isCompleted && (
                        <Text style={styles.stepCheck}>✓</Text>
                      )} */}
                      {isActive && <View style={styles.stepDotInner} />}
                    </View>
                    {/* Label */}
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

            {/* Date picker */}
            <Text style={styles.sectionTitle}>Date</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.dateScroll}
              contentContainerStyle={{ gap: 8, paddingRight: 4 }}
            >
              {dates.map((d) => (
                <Pressable
                  key={d.iso}
                  onPress={() => setSelectedDate(d.iso)}
                  style={[
                    styles.dateChip,
                    selectedDate === d.iso && styles.dateChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.dateChipDay,
                      selectedDate === d.iso && styles.dateChipTextSelected,
                    ]}
                  >
                    {d.day}
                  </Text>
                  <Text
                    style={[
                      styles.dateChipLabel,
                      selectedDate === d.iso && styles.dateChipTextSelected,
                    ]}
                  >
                    {d.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Slots */}
            <Text style={styles.sectionTitle}>Available Slots</Text>

            {/* Slots scroll — takes remaining vertical space */}
            <ScrollView
              style={styles.slotScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.slotGrid}
            >
              {slots.length === 0 ? (
                <Text style={styles.emptyText}>No slots available</Text>
              ) : (
                slots.map((slot) => (
                  <Pressable
                    key={slot.startTime}
                    disabled={slot.disabled}
                    onPress={() => setSelectedSlot(slot.startTime)}
                    style={[
                      styles.slotButton,
                      selectedSlot === slot.startTime && styles.slotSelected,
                      slot.disabled && styles.slotDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.slotText,
                        selectedSlot === slot.startTime && styles.slotTextSelected,
                      ]}
                    >
                      {slot.startTime}
                    </Text>
                  </Pressable>
                ))
              )}
            </ScrollView>

            {/* Continue — always visible at bottom */}
            <Pressable
              disabled={!selectedSlot}
              style={[styles.continueButton, !selectedSlot && { opacity: 0.45 }]}
              onPress={() =>
                navigation.navigate("BookingStylist", {
                  salonId,
                  salonName,
                  date: selectedDate,
                  startTime: selectedSlot!,
                  selectedServices,
                })
              }
            >
              <Text style={styles.continueButtonText}>Continue →</Text>
            </Pressable>

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
  },
  page: {
    flex: 1,
    backgroundColor: colors.page,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },

  // Header
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
  },
  progressHint: {
    color: colors.textSoft,
    marginTop: 4,
    marginBottom: 20,
    fontSize: 13,
  },

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
    backgroundColor: colors.page,
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

  // Section title
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 10,
  },

  // Date picker
  dateScroll: {
    marginBottom: 20,
    flexGrow: 0,
  },
  dateChip: {
    backgroundColor: colors.chip,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
    minWidth: 64,
  },
  dateChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dateChipDay: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 2,
  },
  dateChipLabel: {
    color: colors.textSoft,
    fontSize: 12,
  },
  dateChipTextSelected: {
    color: colors.white,
  },

  // Slot grid
  slotScroll: {
    flex: 1, // fills remaining vertical space
    marginBottom: 12,
  },
  slotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  emptyText: {
    color: colors.textSoft,
    fontStyle: "italic",
  },
  slotButton: {
    width: "31%", // ~3 per row
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  slotSelected: {
    backgroundColor: colors.cardSoft,
    borderColor: colors.primaryLight,
  },
  slotDisabled: {
    opacity: 0.35,
  },
  slotText: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 13,
  },
  slotTextSelected: {
    color: colors.primaryLight,
  },

  // Continue button — pinned to bottom
  continueButton: {
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingVertical: 14,
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