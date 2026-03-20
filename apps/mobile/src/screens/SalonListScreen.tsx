import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { API_BASE_URL } from "../config/api";
import { SalonListItem } from "../types/salon";
import { colors } from "../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "SalonList">;

export default function SalonListScreen({ navigation }: Props) {
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
          <Text style={styles.screenTitle}>Salon Search</Text>

          <View style={styles.searchRow}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search salons..."
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
            <Pressable style={styles.searchButton} onPress={fetchSalons}>
              <Text style={styles.searchButtonText}>Search</Text>
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator style={{ marginTop: 30 }} />
          ) : (
            <FlatList
              data={salons}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={{ gap: 12 }}
              contentContainerStyle={{ gap: 12, paddingTop: 16 }}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.card}
                  onPress={() => navigation.navigate("SalonDetail", { salonId: item.id })}
                >
                  <View style={styles.photoPlaceholder} />
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardMeta}>{item.address || "Address unavailable"}</Text>
                  <Text style={styles.cardMeta}>
                    ⭐ {item.rating.toFixed(1)} · {item.stylistCount} stylists
                  </Text>
                </Pressable>
              )}
            />
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
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
  screenTitle: {
    fontSize: 20,
    color: colors.text,
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.chip,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 42,
    color: colors.text,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  searchButtonText: {
    color: colors.white,
    fontWeight: "700",
  },
  card: {
    flex: 1,
    backgroundColor: colors.cardSoft,
    borderRadius: 18,
    padding: 10,
  },
  photoPlaceholder: {
    height: 110,
    borderRadius: 14,
    backgroundColor: colors.card,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.textSoft,
  },
});