// D:\trimly\apps\mobile\src\screens\SalonListScreen.tsx
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { API_BASE_URL } from "../config/api";
import { SalonListItem } from "../types/salon";
import { colors } from "../theme/colors";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  navigation?: any;
  route?: any;
};

export default function SalonListScreen({ navigation: navProp }: Props) {
  const hookNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const navigation = navProp ?? hookNav;

  const [query, setQuery] = useState("");
  const [salons, setSalons] = useState<SalonListItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchSalons() {
    try {
      setLoading(true);
      const res = await fetch(
        `${API_BASE_URL}/api/mobile/salons${query ? `?q=${encodeURIComponent(query)}` : ""}`
      );
      const data = await res.json();
      setSalons(data.salons || []);
    } catch (error) {
      console.log("fetch salons error", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSalons();
  }, []);

  return (
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
            <Text style={styles.screenSub}>Find your perfect look nearby</Text>
          </View>

          {/* Search bar */}
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
                onSubmitEditing={fetchSalons}
                placeholder="Search salons..."
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                returnKeyType="search"
              />
              {query.length > 0 && (
                <Pressable onPress={() => { setQuery(""); fetchSalons(); }}>
                  <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                </Pressable>
              )}
            </View>
            <Pressable style={styles.searchButton} onPress={fetchSalons}>
              <Text style={styles.searchButtonText}>Search</Text>
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={colors.primaryLight} />
          ) : salons.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="cut-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>No salons found</Text>
            </View>
          ) : (
            <FlatList
              data={salons}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={{ gap: 12 }}
              contentContainerStyle={{ gap: 12, paddingTop: 16, paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <SalonCard
                  item={item}
                  onPress={() => navigation.navigate("SalonDetail", { salonId: item.id })}
                />
              )}
            />
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function SalonCard({
  item,
  onPress,
}: {
  item: SalonListItem;
  onPress: () => void;
}) {
  const firstPhoto = item.photos?.[0];

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      onPress={onPress}
    >
      {/* Photo */}
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

      {/* Pill badge over image */}
      <View style={styles.ratingBadge}>
        <Text style={styles.ratingBadgeText}>⭐ {item.rating.toFixed(1)}</Text>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          <Ionicons name="location-outline" size={11} color={colors.textMuted} />
          {" "}{item.address || "Address unavailable"}
        </Text>
        <View style={styles.cardFooter}>
          <Ionicons name="people-outline" size={12} color={colors.textMuted} />
          <Text style={styles.cardMetaSmall}> {item.stylistCount} stylists</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  page: {
    flex: 1,
    margin: 12,
    borderRadius: 24,
    backgroundColor: colors.page,
    padding: 14,
  },
  header: {
    marginBottom: 14,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
  },
  screenSub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  searchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.chip,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 42,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: "center",
    paddingHorizontal: 16,
    height: 42,
  },
  searchButtonText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 14,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
  },
  card: {
    flex: 1,
    backgroundColor: colors.cardSoft,
    borderRadius: 18,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: 115,
  },
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
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  ratingBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  cardBody: {
    padding: 10,
    gap: 3,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  cardMeta: {
    fontSize: 11,
    color: colors.textMuted,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  cardMetaSmall: {
    fontSize: 11,
    color: colors.textMuted,
  },
});