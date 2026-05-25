// D:\trimly\apps\mobile\src\screens\SalonDetailsScreen.tsx
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
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
import { Ionicons } from "@expo/vector-icons";
import LoadingOverlay from "../components/LoadingOverlay";

type Props = NativeStackScreenProps<RootStackParamList, "SalonDetail">;

const SCREEN_WIDTH = Dimensions.get("window").width;
// page has margin 12 + borderRadius padding 18 on each side
const PHOTO_WIDTH = SCREEN_WIDTH - 24 - 36;

export default function SalonDetailScreen({ route, navigation }: Props) {
  const { salonId } = route.params;
  const [salon, setSalon] = useState<SalonDetail | null>(null);
  const [tab, setTab] = useState<"services" | "about" | "team">("services");
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);

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
    return <LoadingOverlay />;
  }

  if (!salon) return null;

  const photos: string[] = salon.photos ?? [];

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

            {/* ── Photo carousel ── */}
            {photos.length > 0 ? (
              <View style={styles.carouselWrap}>
                <FlatList
                  data={photos}
                  keyExtractor={(_, i) => String(i)}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={PHOTO_WIDTH + 10}
                  decelerationRate="fast"
                  onMomentumScrollEnd={(e) => {
                    const index = Math.round(
                      e.nativeEvent.contentOffset.x / (PHOTO_WIDTH + 10)
                    );
                    setActivePhoto(index);
                  }}
                  contentContainerStyle={{ gap: 10 }}
                  renderItem={({ item }) => (
                    <Image
                      source={{ uri: item }}
                      style={[styles.carouselPhoto, { width: PHOTO_WIDTH }]}
                      resizeMode="cover"
                    />
                  )}
                />
                {/* Dot indicators */}
                {photos.length > 1 && (
                  <View style={styles.dots}>
                    {photos.map((_, i) => (
                      <View
                        key={i}
                        style={[styles.dot, i === activePhoto && styles.dotActive]}
                      />
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="cut-outline" size={32} color={colors.textMuted} />
              </View>
            )}

            <Pressable
              style={styles.bookButton}
              onPress={() =>
                navigation.navigate("BookingServices", { salonId: salon.id })
              }
            >
              <Text style={styles.bookButtonText}>Book Appointment</Text>
            </Pressable>

            <View style={styles.tabRow}>
              {(["services", "about", "team"] as const).map((t) => (
                <Pressable key={t} onPress={() => setTab(t)}>
                  <Text style={[styles.tab, tab === t && styles.tabActive]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </Pressable>
              ))}
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
  carouselWrap: {
    marginTop: 16,
    marginBottom: 18,
  },
  carouselPhoto: {
    height: 200,
    borderRadius: 16,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textMuted,
  },
  dotActive: {
    backgroundColor: colors.text,
    width: 18,
  },
  photoPlaceholder: {
    height: 160,
    backgroundColor: colors.card,
    borderRadius: 16,
    marginTop: 16,
    marginBottom: 18,
    alignItems: "center",
    justifyContent: "center",
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