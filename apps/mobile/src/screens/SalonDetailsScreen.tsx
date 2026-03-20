import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { SalonDetail } from "../types/salon";
import { colors } from "../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "SalonDetail">;

export default function SalonDetailScreen({ route, navigation }: Props) {
  const { salonId } = route.params;
  const [salon, setSalon] = useState<SalonDetail | null>(null);
  const [tab, setTab] = useState<"services" | "about" | "team">("services");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/mobile/salons/${salonId}`);
        const data = await res.json();
        setSalon(data.salon);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    })();
  }, [salonId]);

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  if (!salon) {
    return null;
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
            <Text style={styles.title}>{salon.name}</Text>
            <Text style={styles.meta}>{salon.address || "-"}</Text>
            <Text style={styles.openText}>Open till 18:00</Text>
            <Text style={styles.rating}>⭐⭐⭐⭐☆</Text>

            <View style={styles.photoStrip}>
              {Array.from({ length: 3 }).map((_, i) => (
                <View key={i} style={styles.photo} />
              ))}
            </View>

            <Pressable
              style={styles.bookButton}
              onPress={() =>
                navigation.navigate("BookingServices", { salonId: salon.id })
              }
            >
              <Text style={styles.bookButtonText}>Book Appointment</Text>
            </Pressable>

            <View style={styles.tabRow}>
              <Pressable onPress={() => setTab("services")}>
                <Text style={[styles.tab, tab === "services" && styles.tabActive]}>Services</Text>
              </Pressable>
              <Pressable onPress={() => setTab("about")}>
                <Text style={[styles.tab, tab === "about" && styles.tabActive]}>About</Text>
              </Pressable>
              <Pressable onPress={() => setTab("team")}>
                <Text style={[styles.tab, tab === "team" && styles.tabActive]}>Team</Text>
              </Pressable>
            </View>

            {tab === "services" &&
              salon.categories.map((category) => (
                <View key={category.id} style={{ marginBottom: 16 }}>
                  <Text style={styles.sectionTitle}>{category.name}</Text>
                  {category.services.map((service) => (
                    <View key={service.id} style={styles.serviceCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.serviceName}>{service.name}</Text>
                        <Text style={styles.serviceDesc}>
                          {service.description || "Professional treatment"}
                        </Text>
                        <Text style={styles.serviceMeta}>
                          {service.durationMin} min | LKR {service.priceLkr}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ))}

            {tab === "about" && (
              <View>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.aboutText}>{salon.about}</Text>
              </View>
            )}

            {tab === "team" && (
              <View>
                <Text style={styles.sectionTitle}>Team</Text>
                {salon.stylists.map((stylist) => (
                  <View key={stylist.id} style={styles.serviceCard}>
                    <Text style={styles.serviceName}>{stylist.name}</Text>
                    <Text style={styles.serviceDesc}>
                      {stylist.bio || "Professional stylist"}
                    </Text>
                  </View>
                ))}
              </View>
            )}
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
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: colors.text,
  },
  meta: {
    color: colors.textSoft,
    marginTop: 4,
  },
  openText: {
    color: colors.accent,
    marginTop: 2,
  },
  rating: {
    marginTop: 6,
    color: colors.star,
  },
  photoStrip: {
    gap: 10,
    marginTop: 16,
    marginBottom: 18,
  },
  photo: {
    height: 90,
    backgroundColor: colors.card,
    borderRadius: 16,
  },
  bookButton: {
    alignSelf: "center",
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginBottom: 20,
  },
  bookButtonText: {
    color: colors.text,
    fontWeight: "600",
  },
  tabRow: {
    flexDirection: "row",
    gap: 18,
    marginBottom: 16,
  },
  tab: {
    color: colors.textSoft,
  },
  tabActive: {
    color: colors.text,
    textDecorationLine: "underline",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 10,
  },
  serviceCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  serviceName: {
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  serviceDesc: {
    color: colors.textSoft,
    fontSize: 12,
  },
  serviceMeta: {
    color: colors.textSoft,
    fontSize: 12,
    marginTop: 4,
  },
  aboutText: {
    color: colors.textSoft,
    lineHeight: 22,
  },
});