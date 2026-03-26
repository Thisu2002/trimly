import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme/colors";
import { API_BASE_URL } from "../config/api";
import { AppointmentHistoryItem } from "../types/appointment";
import { AuthUser } from "../types/auth";

type Props = {
  user: AuthUser | null;
};

export default function AppointmentHistoryScreen({ user }: Props) {
  const [data, setData] = useState<AppointmentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const userSub = user?.sub;

  useEffect(() => {
    fetchAppointments();
  }, []);

  async function fetchAppointments() {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/appointment/list/${userSub}`,
      );
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.log("Fetch appointments error:", err);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "completed":
        return colors.success;
      case "confirmed":
        return colors.primaryLight;
      case "cancelled":
        return "#EF4444";
      default:
        return colors.textMuted;
    }
  }

  function renderItem({ item }: { item: AppointmentHistoryItem }) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.salon}>{item.salonName}</Text>
          <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>

        <Text style={styles.date}>
          {new Date(item.date).toDateString()} • {item.startTime} -{" "}
          {item.endTime}
        </Text>

        <View style={styles.divider} />

        {item.services.map((s, i) => (
          <View key={i} style={styles.serviceRow}>
            <Text style={styles.serviceName}>{s.name}</Text>
            <Text style={styles.serviceMeta}>
              {s.stylist} • LKR {s.priceLkr}
            </Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.total}>LKR {item.totalLkr}</Text>
        </View>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[colors.gradientLeft, colors.gradientRight]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 2, y: 0.5 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.safe}>
        <Text style={styles.title}>My Appointments</Text>

        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, padding: 16 },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 16,
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  salon: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },

  status: {
    fontSize: 12,
    fontWeight: "700",
  },

  date: {
    fontSize: 13,
    color: colors.textSoft,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },

  serviceRow: {
    marginBottom: 6,
  },

  serviceName: {
    color: colors.text,
    fontWeight: "600",
  },

  serviceMeta: {
    color: colors.textMuted,
    fontSize: 12,
  },

  footer: {
    marginTop: 10,
    alignItems: "flex-end",
  },

  total: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primaryLight,
  },
});
