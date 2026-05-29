import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { API_BASE_URL } from "../config/api";
import { AvailableStylistGroup, StylistItem } from "../types/salon";
import { colors } from "../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "BookingStylist">;

const STEPS = ["Services", "Date & Time", "Stylist", "Confirm"];
const CURRENT_STEP = 2;

export default function BookingStylistScreen({ route, navigation }: Props) {
  const { salonId, salonName, date, startTime, selectedServices } =
    route.params;
  const [groups, setGroups] = useState<AvailableStylistGroup[]>([]);
  const [selectedStylists, setSelectedStylists] = useState<
    Record<string, StylistItem>
  >({});
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/mobile/stylists/available`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              salonId,
              date,
              startTime,
              selectedServices: selectedServices.map((s) => ({
                serviceId: s.id,
                sequence: s.sequence!,
              })),
            }),
          },
        );
        const data = await res.json();
        setGroups(data.items || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const ready = useMemo(
    () => selectedServices.every((service) => selectedStylists[service.id]),
    [selectedStylists, selectedServices],
  );

  function pickStylist(serviceId: string, stylist: StylistItem) {
    setSelectedStylists((prev) => ({ ...prev, [serviceId]: stylist }));
  }

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
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingBottom: 12 }}
            >
              <Text style={styles.title}>{salonName}</Text>
              <Text style={styles.meta}>
                {date} · {startTime}
              </Text>

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

              {loading ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primaryLight}
                  style={{ marginVertical: 40 }}
                />
              ) : (
                groups.map((group) => (
                  <View key={group.serviceId} style={{ marginBottom: 20 }}>
                    <Text style={styles.groupTitle}>{group.serviceName}</Text>
                    {group.stylists.length === 0 ? (
                      <Text style={styles.emptyText}>
                        No stylist available for this slot.
                      </Text>
                    ) : (
                      <View style={styles.grid}>
                        {group.stylists.map((stylist) => {
                          const active =
                            selectedStylists[group.serviceId]?.id ===
                            stylist.id;
                          return (
                            <Pressable
                              key={stylist.id}
                              style={[
                                styles.stylistCard,
                                active && styles.stylistCardActive,
                              ]}
                              onPress={() =>
                                pickStylist(group.serviceId, stylist)
                              }
                            >
                              <View style={styles.avatar} />
                              <Text style={styles.stylistName}>
                                {stylist.name}
                              </Text>
                              <Text style={styles.profileText}>
                                View Profile
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
            <View
              style={[
                styles.pinnedPanel,
                { paddingBottom: insets.bottom > 0 ? 0 : 4 },
              ]}
            >
              <Pressable
                disabled={!ready}
                style={[styles.continueButton, !ready && { opacity: 0.5 }]}
                onPress={() =>
                  navigation.navigate("BookingSummary", {
                    salonId,
                    salonName,
                    date,
                    startTime,
                    selectedServices,
                    selectedStylists,
                    idToken: "",
                  })
                }
              >
                <Text style={styles.continueButtonText}>Continue →</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  outer: { padding: 12, flex: 1, paddingBottom: 62 + 16 },
  page: {
    flex: 1,
    backgroundColor: colors.page,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  title: { fontSize: 28, fontWeight: "800", color: colors.text },
  meta: { color: colors.textSoft, marginBottom: 20 },

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

  groupTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  emptyText: {
    color: colors.textSoft,
    fontStyle: "italic",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  stylistCard: {
    width: "47%",
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  stylistCardActive: {
    borderColor: colors.primaryLight,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.chip,
    marginBottom: 8,
  },
  stylistName: {
    color: colors.text,
    fontWeight: "700",
    textAlign: "center",
  },
  profileText: {
    color: colors.gradientRight,
    fontSize: 12,
    marginTop: 2,
  },
  pinnedPanel: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    paddingBottom: 16,
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
