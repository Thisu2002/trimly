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

function next7Days() {
  const result: string[] = [];
  const d = new Date();

  for (let i = 0; i < 7; i++) {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    result.push(x.toISOString().slice(0, 10));
  }

  return result;
}

export default function BookingDateTimeScreen({ route, navigation }: Props) {
  const { salonId, salonName, selectedServices } = route.params;
  const dates = useMemo(() => next7Days(), []);
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  async function fetchSlots(date: string) {
    const res = await fetch(`${API_BASE_URL}/api/mobile/slots`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        salonId,
        date,
      }),
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
        <ScrollView contentContainerStyle={styles.outer}>
          <View style={styles.page}>
            <Text style={styles.title}>{salonName}</Text>
            <Text style={styles.progressHint}>Choose date and time</Text>

            <View style={styles.progressRow}>
              <Text style={styles.progress}>Services</Text>
              <Text style={styles.progressActive}>Date & Time</Text>
              <Text style={styles.progress}>Stylist</Text>
              <Text style={styles.progress}>Confirm</Text>
            </View>

            <Text style={styles.sectionTitle}>Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {dates.map((date) => (
                  <Pressable
                    key={date}
                    onPress={() => setSelectedDate(date)}
                    style={[
                      styles.dateChip,
                      selectedDate === date && styles.dateChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dateChipText,
                        selectedDate === date && { color: colors.white },
                      ]}
                    >
                      {date}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.sectionTitle}>Available Slots</Text>
            <View style={styles.slotList}>
              {slots.map((slot) => (
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
                  <Text style={styles.slotText}>{slot.startTime}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              disabled={!selectedSlot}
              style={[
                styles.continueButton,
                !selectedSlot && { opacity: 0.5 },
              ]}
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
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  title: { fontSize: 34, fontWeight: "800", color: colors.text },
  progressHint: { color: colors.textSoft, marginTop: 4, marginBottom: 14 },
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
    color: colors.text,
    marginBottom: 10,
  },
  dateChip: {
    backgroundColor: colors.chip,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  dateChipSelected: {
    backgroundColor: colors.primary,
  },
  dateChipText: {
    color: colors.text,
    fontSize: 13,
  },
  slotList: {
    gap: 8,
  },
  slotButton: {
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
    opacity: 0.4,
  },
  slotText: {
    color: colors.text,
    fontWeight: "600",
  },
  continueButton: {
    alignSelf: "flex-end",
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 10,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  continueButtonText: {
    color: colors.text,
    fontWeight: "600",
  },
});