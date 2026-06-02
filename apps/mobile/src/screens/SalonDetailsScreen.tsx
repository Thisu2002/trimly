// D:\trimly\apps\mobile\src\screens\SalonDetailsScreen.tsx
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
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
import { SalonDetail } from "../types/salon";
import { colors } from "../theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { StarRating } from "../utils/stars";
import LoadingOverlay from "../components/LoadingOverlay";

type Props = NativeStackScreenProps<RootStackParamList, "SalonDetail">;

const SCREEN_WIDTH = Dimensions.get("window").width;
const PHOTO_WIDTH = SCREEN_WIDTH - 24 - 36;

type TabType = "services" | "about" | "team" | "reviews";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SalonDetailScreen({ route, navigation }: Props) {
  const { salonId } = route.params;
  const [salon, setSalon] = useState<SalonDetail | null>(null);
  const [tab, setTab] = useState<TabType>("services");
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const insets = useSafeAreaInsets();

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

  if (loading) return <LoadingOverlay />;
  if (!salon) return null;

  const photos: string[] = salon.photos ?? [];
  const tabs: { key: TabType; label: string }[] = [
    { key: "services", label: "Services" },
    { key: "about", label: "About" },
    { key: "team", label: "Team" },
    {
      key: "reviews",
      label: `Reviews${salon.reviewCount > 0 ? ` (${salon.reviewCount})` : ""}`,
    },
  ];

  return (
    <LinearGradient
      colors={[colors.gradientLeft, colors.gradientRight]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 2, y: 0.5 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[
            styles.outer,
            { paddingBottom: 5 + insets.bottom + 3 },
          ]}
        >
          <View style={styles.page}>
            {/* ── Header ── */}
            <Text style={styles.title}>{salon.name}</Text>
            <Text style={styles.meta}>{salon.address || "-"}</Text>
            <Text style={styles.openText}>Open till 18:00</Text>

            <View style={styles.ratingRow}>
              <StarRating rating={salon.rating} size={15} />
              <Text style={styles.ratingLabel}>
                {salon.rating > 0
                  ? `${salon.rating.toFixed(1)}  ·  ${salon.reviewCount} review${salon.reviewCount !== 1 ? "s" : ""}`
                  : "No reviews yet"}
              </Text>
            </View>

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
                      e.nativeEvent.contentOffset.x / (PHOTO_WIDTH + 10),
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
                {photos.length > 1 && (
                  <View style={styles.dots}>
                    {photos.map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.dot,
                          i === activePhoto && styles.dotActive,
                        ]}
                      />
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons
                  name="cut-outline"
                  size={32}
                  color={colors.textMuted}
                />
              </View>
            )}

            {/* ── Book button ── */}
            <Pressable
              style={styles.bookButton}
              onPress={() =>
                navigation.navigate("BookingServices", { salonId: salon.id })
              }
            >
              <Text style={styles.bookButtonText}>Book Appointment</Text>
            </Pressable>

            {/* ── Tabs ── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tabScroll}
              contentContainerStyle={styles.tabRow}
            >
              {tabs.map(({ key, label }) => (
                <Pressable
                  key={key}
                  onPress={() => setTab(key)}
                  style={styles.tabItem}
                >
                  <Text style={[styles.tab, tab === key && styles.tabActive]}>
                    {label}
                  </Text>
                  {tab === key && <View style={styles.tabUnderline} />}
                </Pressable>
              ))}
            </ScrollView>

            {/* ── Services tab ── */}
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
                          {service.durationMin} min · LKR {service.priceLkr}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ))}

            {/* ── About tab ── */}
            {tab === "about" && (
              <View>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.aboutText}>{salon.about? salon.about : " No information available."}</Text>
              </View>
            )}

            {/* ── Team tab ── */}
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

            {/* ── Reviews tab ── */}
            {tab === "reviews" && (
              <View>
                <Text style={styles.sectionTitle}>Reviews</Text>

                {/* Summary bar */}
                {salon.reviewCount > 0 && (
                  <View style={styles.reviewSummary}>
                    <Text style={styles.reviewBigRating}>
                      {salon.rating.toFixed(1)}
                    </Text>
                    <View style={styles.reviewSummaryRight}>
                      <StarRating rating={salon.rating} size={20} />
                      <Text style={styles.reviewSummaryCount}>
                        Based on {salon.reviewCount} review
                        {salon.reviewCount !== 1 ? "s" : ""}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Review cards */}
                {!salon.reviews || salon.reviews.length === 0 ? (
                  <View style={styles.emptyReviews}>
                    <Ionicons
                      name="chatbubble-outline"
                      size={28}
                      color={colors.textMuted}
                    />
                    <Text style={styles.emptyReviewsText}>No reviews yet</Text>
                  </View>
                ) : (
                  salon.reviews.map((review) => (
                    <View key={review.id} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        <View style={styles.reviewAvatar}>
                          <Text style={styles.reviewAvatarText}>
                            {(review.customerName ?? "A")[0].toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.reviewCustomer}>
                            {review.customerName ?? "Anonymous"}
                          </Text>
                          <Text style={styles.reviewDate}>
                            {formatDate(review.createdAt)}
                          </Text>
                        </View>
                        <StarRating rating={review.rating} size={13} />
                      </View>
                      {review.comment ? (
                        <Text style={styles.reviewComment}>
                          {review.comment}
                        </Text>
                      ) : null}
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

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

  // Rating row
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    marginBottom: 2,
  },
  ratingLabel: {
    color: colors.textSoft,
    fontSize: 13,
  },

  // Carousel
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

  // Book button
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

  // Tabs — horizontal scroll so "Reviews (12)" never gets clipped
  tabScroll: {
    marginBottom: 16,
  },
  tabRow: {
    flexDirection: "row",
    gap: 20,
    paddingRight: 4,
  },
  tabItem: {
    alignItems: "center",
    paddingBottom: 6,
  },
  tab: {
    color: colors.textSoft,
    fontSize: 14,
  },
  tabActive: {
    color: colors.text,
    fontWeight: "700",
  },
  tabUnderline: {
    height: 2,
    width: "100%",
    backgroundColor: colors.text,
    borderRadius: 2,
    marginTop: 4,
  },

  // Shared content styles
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

  // Reviews
  reviewSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  reviewBigRating: {
    fontSize: 40,
    fontWeight: "800",
    color: colors.text,
  },
  reviewSummaryRight: {
    gap: 4,
  },
  reviewSummaryStars: {
    fontSize: 18,
  },
  reviewSummaryCount: {
    color: colors.textSoft,
    fontSize: 12,
  },
  reviewCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    gap: 8,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  reviewAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.chip,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewAvatarText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 14,
  },
  reviewCustomer: {
    fontWeight: "700",
    color: colors.text,
    fontSize: 13,
  },
  reviewDate: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  reviewStars: {
    fontSize: 12,
  },
  reviewComment: {
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 20,
  },
  emptyReviews: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 8,
  },
  emptyReviewsText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
