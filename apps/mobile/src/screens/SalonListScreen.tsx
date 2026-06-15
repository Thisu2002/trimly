// D:\trimly\apps\mobile\src\screens\SalonListScreen.tsx

import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import { RootStackParamList } from "../navigation/RootNavigator";
import { API_BASE_URL } from "../config/api";
import { colors } from "../theme/colors";
import { Ionicons } from "@expo/vector-icons";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortBy = "newest" | "rating" | "nearest";

interface SalonItem {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  rating: number;
  serviceCount: number;
  stylistCount: number;
  photos: string[];
  distanceKm: number | null;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Filters {
  sortBy: SortBy;
  minRating: number;
  radiusKm: number;
}

const DEFAULT_FILTERS: Filters = {
  sortBy: "newest",
  minRating: 0,
  radiusKm: 50,
};

const SORT_OPTIONS: { value: SortBy; label: string; icon: string }[] = [
  { value: "newest", label: "Newest", icon: "time-outline" },
  { value: "rating", label: "Top Rated", icon: "star-outline" },
  { value: "nearest", label: "Nearest", icon: "navigate-outline" },
];

const RATING_OPTIONS = [0, 3, 3.5, 4, 4.5];
const RADIUS_OPTIONS = [5, 10, 25, 50];

// ─── Screen ───────────────────────────────────────────────────────────────────

type Props = { navigation?: any; route?: any };

export default function SalonListScreen({ navigation: navProp }: Props) {
  const hookNav =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const navigation = navProp ?? hookNav;

  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [draft, setDraft] = useState<Filters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  const [salons, setSalons] = useState<SalonItem[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);

  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // ── Location ──────────────────────────────────────────────────────────────
  async function requestLocation() {
    setLocationError(null);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setLocationError("Location permission denied. Showing all salons.");
      return null;
    }
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
    setUserCoords(coords);
    return coords;
  }

  // ── Fetch ─────────────────────────────────────────────────────────────────
  async function fetchSalons(
    pageNum: number,
    appliedFilters: Filters,
    coords: typeof userCoords,
    q: string,
    append = false,
  ) {
    try {
      append ? setLoadingMore(true) : setLoading(true);

      const params = new URLSearchParams({
        page: String(pageNum),
        limit: "20",
        sortBy: appliedFilters.sortBy,
        minRating: String(appliedFilters.minRating),
        radiusKm: String(appliedFilters.radiusKm),
      });
      if (q) params.set("q", q);
      if (coords) {
        params.set("lat", String(coords.lat));
        params.set("lng", String(coords.lng));
      }

      const res = await fetch(`${API_BASE_URL}/api/mobile/salons?${params}`);
      const data = await res.json();

      if (append) {
        setSalons((prev) => [...prev, ...(data.salons || [])]);
      } else {
        setSalons(data.salons || []);
      }
      setMeta(data.meta || null);
    } catch (err) {
      console.error("fetch salons error", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    fetchSalons(1, filters, userCoords, query);
    setPage(1);
  }, []);

  // ── Apply filters ─────────────────────────────────────────────────────────
  async function applyFilters() {
    setFilterOpen(false);
    let coords = userCoords;

    if (draft.sortBy === "nearest" && !coords) {
      coords = await requestLocation();
      if (!coords) {
        setDraft((d) => ({ ...d, sortBy: "rating" }));
        return;
      }
    }

    setFilters(draft);
    setPage(1);
    fetchSalons(1, draft, coords, query);
  }

  // ── Infinite scroll ───────────────────────────────────────────────────────
  function onEndReached() {
    if (!meta || page >= meta.totalPages || loadingMore || loading) return;
    const next = page + 1;
    setPage(next);
    fetchSalons(next, filters, userCoords, query, true);
  }

  function submitSearch() {
    setPage(1);
    fetchSalons(1, filters, userCoords, query);
  }

  const activeFilterCount =
    (filters.sortBy !== "newest" ? 1 : 0) + (filters.minRating > 0 ? 1 : 0);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <LinearGradient
        colors={[colors.gradientLeft, colors.gradientRight]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 2, y: 0.5 }}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={styles.safe}>
          <View style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.screenTitle}>Discover Salons</Text>
              <Text style={styles.screenSub}>
                {meta
                  ? `${meta.total} salon${meta.total !== 1 ? "s" : ""} found`
                  : "Find your perfect look nearby"}
              </Text>
            </View>

            {/* Search + filter button */}
            <View style={styles.searchRow}>
              <View style={styles.searchWrap}>
                <Ionicons
                  name="search-outline"
                  size={16}
                  color={colors.textMuted}
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  onSubmitEditing={submitSearch}
                  placeholder="Search salons..."
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  returnKeyType="search"
                />
                {query.length > 0 && (
                  <Pressable
                    onPress={() => {
                      setQuery("");
                      fetchSalons(1, filters, userCoords, "");
                    }}
                  >
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color={colors.textMuted}
                    />
                  </Pressable>
                )}
              </View>

              <Pressable
                style={styles.filterButton}
                onPress={() => {
                  setDraft(filters);
                  setFilterOpen(true);
                }}
              >
                <Ionicons
                  name="options-outline"
                  size={18}
                  color={colors.white}
                />
                {activeFilterCount > 0 && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>
                      {activeFilterCount}
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>

            {/* Sort chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipRowContainer}
              contentContainerStyle={styles.chipRowContent}
            >
              {SORT_OPTIONS.map((opt) => {
                const active = filters.sortBy === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={async () => {
                      let coords = userCoords;
                      if (opt.value === "nearest" && !coords) {
                        coords = await requestLocation();
                        if (!coords) return;
                      }
                      const next = { ...filters, sortBy: opt.value };
                      setFilters(next);
                      setPage(1);
                      fetchSalons(1, next, coords, query);
                    }}
                  >
                    <Ionicons
                      name={opt.icon as any}
                      size={13}
                      color={active ? colors.white : colors.textMuted}
                    />
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}

              {[4, 4.5].map((r) => {
                const active = filters.minRating === r;
                return (
                  <Pressable
                    key={`rating-${r}`}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => {
                      const next = { ...filters, minRating: active ? 0 : r };
                      setFilters(next);
                      setPage(1);
                      fetchSalons(1, next, userCoords, query);
                    }}
                  >
                    <Ionicons
                      name="star"
                      size={12}
                      color={active ? colors.white : "#F5A623"}
                    />
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {r}+
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Location error banner */}
            {locationError && (
              <View style={styles.locationBanner}>
                <Ionicons name="warning-outline" size={14} color="#F5A623" />
                <Text style={styles.locationBannerText}>{locationError}</Text>
              </View>
            )}

            {/* List */}
            {loading ? (
              <ActivityIndicator
                style={{ marginTop: 40 }}
                color={colors.primaryLight}
              />
            ) : salons.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons
                  name="cut-outline"
                  size={40}
                  color={colors.textMuted}
                />
                <Text style={styles.emptyText}>No salons found</Text>
                <Pressable
                  onPress={() => {
                    setFilters(DEFAULT_FILTERS);
                    setQuery("");
                    fetchSalons(1, DEFAULT_FILTERS, userCoords, "");
                  }}
                >
                  <Text style={styles.resetText}>Clear filters</Text>
                </Pressable>
              </View>
            ) : (
              <FlatList
                data={salons}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={{ gap: 12 }}
                contentContainerStyle={{
                  gap: 12,
                  paddingTop: 16,
                  paddingBottom: 50,
                }}
                showsVerticalScrollIndicator={false}
                onEndReached={onEndReached}
                onEndReachedThreshold={0.4}
                renderItem={({ item }) => (
                  <SalonCard
                    item={item}
                    showDistance={userCoords !== null}
                    onPress={() =>
                      navigation.navigate("SalonDetail", { salonId: item.id })
                    }
                  />
                )}
                ListFooterComponent={
                  loadingMore ? (
                    <ActivityIndicator
                      style={{ marginVertical: 16 }}
                      color={colors.primaryLight}
                    />
                  ) : null
                }
              />
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ── Filter Modal ── */}
      <Modal
        visible={filterOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setFilterOpen(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.modalSheet}>
          <View style={styles.sheetHandle} />

          <Text style={styles.sheetTitle}>Filters</Text>

          <Text style={styles.sheetLabel}>Sort By</Text>
          <View style={styles.sheetOptionRow}>
            {SORT_OPTIONS.map((opt) => {
              const active = draft.sortBy === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.sheetOption,
                    active && styles.sheetOptionActive,
                  ]}
                  onPress={() => setDraft((d) => ({ ...d, sortBy: opt.value }))}
                >
                  <Ionicons
                    name={opt.icon as any}
                    size={15}
                    color={active ? colors.white : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.sheetOptionText,
                      active && styles.sheetOptionTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sheetLabel}>Minimum Rating</Text>
          <View style={styles.sheetOptionRow}>
            {RATING_OPTIONS.map((r) => {
              const active = draft.minRating === r;
              return (
                <Pressable
                  key={r}
                  style={[
                    styles.sheetOption,
                    active && styles.sheetOptionActive,
                  ]}
                  onPress={() => setDraft((d) => ({ ...d, minRating: r }))}
                >
                  {r === 0 ? (
                    <Text
                      style={[
                        styles.sheetOptionText,
                        active && styles.sheetOptionTextActive,
                      ]}
                    >
                      Any
                    </Text>
                  ) : (
                    <>
                      <Ionicons
                        name="star"
                        size={13}
                        color={active ? colors.white : "#F5A623"}
                      />
                      <Text
                        style={[
                          styles.sheetOptionText,
                          active && styles.sheetOptionTextActive,
                        ]}
                      >
                        {r}+
                      </Text>
                    </>
                  )}
                </Pressable>
              );
            })}
          </View>

          {(draft.sortBy === "nearest" || userCoords) && (
            <>
              <Text style={styles.sheetLabel}>Radius</Text>
              <View style={styles.sheetOptionRow}>
                {RADIUS_OPTIONS.map((km) => {
                  const active = draft.radiusKm === km;
                  return (
                    <Pressable
                      key={km}
                      style={[
                        styles.sheetOption,
                        active && styles.sheetOptionActive,
                      ]}
                      onPress={() => setDraft((d) => ({ ...d, radiusKm: km }))}
                    >
                      <Text
                        style={[
                          styles.sheetOptionText,
                          active && styles.sheetOptionTextActive,
                        ]}
                      >
                        {km} km
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          <View style={styles.sheetActions}>
            <Pressable
              style={styles.sheetReset}
              onPress={() => setDraft(DEFAULT_FILTERS)}
            >
              <Text style={styles.sheetResetText}>Reset</Text>
            </Pressable>
            <Pressable style={styles.sheetApply} onPress={applyFilters}>
              <Text style={styles.sheetApplyText}>Apply</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ─── Salon Card ───────────────────────────────────────────────────────────────

function SalonCard({
  item,
  showDistance,
  onPress,
}: {
  item: SalonItem;
  showDistance: boolean;
  onPress: () => void;
}) {
  const firstPhoto = item.photos?.[0];
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      onPress={onPress}
    >
      {firstPhoto ? (
        <Image
          source={{ uri: firstPhoto }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.cardImagePlaceholder}>
          <Ionicons name="cut-outline" size={28} color={colors.textMuted} />
        </View>
      )}

      <View style={styles.ratingBadge}>
        {item.rating > 0 ? (
          <>
            <Ionicons name="star" size={11} color="#F5A623" />
            <Text style={styles.ratingBadgeText}>{item.rating.toFixed(1)}</Text>
          </>
        ) : (
          <Text style={styles.ratingBadgeText}>New</Text>
        )}
      </View>

      {showDistance && item.distanceKm !== null && (
        <View style={styles.distanceBadge}>
          <Ionicons name="navigate" size={10} color="#fff" />
          <Text style={styles.distanceBadgeText}>{item.distanceKm} km</Text>
        </View>
      )}

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          <Ionicons
            name="location-outline"
            size={11}
            color={colors.textMuted}
          />{" "}
          {item.address || "Address unavailable"}
        </Text>
        <View style={styles.cardFooter}>
          <Ionicons name="people-outline" size={12} color={colors.textMuted} />
          <Text style={styles.cardMetaSmall}>
            {" "}
            {item.stylistCount} stylists
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  page: {
    flex: 1,
    margin: 12,
    borderRadius: 24,
    backgroundColor: colors.page,
    padding: 14,
  },
  header: { marginBottom: 14 },
  screenTitle: { fontSize: 22, fontWeight: "800", color: colors.text },
  screenSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },

  searchRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  searchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.chip,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 42,
  },
  input: { flex: 1, color: colors.text, fontSize: 14 },
  filterButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#F5A623",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  filterBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  chipRowContainer: {
    marginTop: 12,
    marginBottom: 4,
    minHeight: 40,
    height: 40,
    flexGrow: 0,
  },
  chipRowContent: {
    gap: 8,
    alignItems: "center",
    paddingRight: 16,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.chip,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 13, color: colors.textMuted, fontWeight: "600" },
  chipTextActive: { color: colors.white },

  locationBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(245,166,35,0.12)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
  },
  locationBannerText: { color: "#F5A623", fontSize: 12, flex: 1 },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  emptyText: { color: colors.textMuted, fontSize: 15 },
  resetText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },

  card: {
    flex: 1,
    backgroundColor: colors.cardSoft,
    borderRadius: 18,
    overflow: "hidden",
  },
  cardImage: { width: "100%", height: 115 },
  cardImagePlaceholder: {
    width: "100%",
    height: 115,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  ratingBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  ratingBadgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  distanceBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  distanceBadgeText: { color: "#fff", fontSize: 10, fontWeight: "600" },
  cardBody: { padding: 10, gap: 3 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
  cardMeta: { fontSize: 11, color: colors.textMuted },
  cardFooter: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  cardMetaSmall: { fontSize: 11, color: colors.textMuted },

  // Modal
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    marginBottom: 30
  },
  sheetHandle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
    marginBottom: 16,
    opacity: 0.4,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 20,
  },
  sheetLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
    marginBottom: 10,
    marginTop: 16,
  },
  sheetOptionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.chip,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sheetOptionActive: { backgroundColor: colors.primary },
  sheetOptionText: { fontSize: 13, color: colors.textMuted, fontWeight: "600" },
  sheetOptionTextActive: { color: colors.white },
  sheetActions: { flexDirection: "row", gap: 12, marginTop: 30 },
  sheetReset: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.chip,
    borderRadius: 14,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetResetText: { color: colors.textMuted, fontWeight: "700", fontSize: 15 },
  sheetApply: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetApplyText: { color: colors.white, fontWeight: "700", fontSize: 15 },
});
