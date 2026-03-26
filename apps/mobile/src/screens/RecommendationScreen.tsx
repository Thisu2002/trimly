import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";

type Recommendation = {
  id: string;
  name: string;
  description: string;
  recommendedStyles: string[];
  reasons: string[];
  score: number;
};

type Service = {
  id: string;
  name: string;
  priceLkr: number;
  durationMin: number;
  category: {
    name: string;
  };
};

type Props = {
  recommendations: Recommendation[];
  matchedServices: Service[];
  onBack: () => void;
};

export default function RecommendationScreen({
  recommendations,
  matchedServices,
  onBack,
}: Props) {
  const renderRecommendation = ({ item }: { item: Recommendation }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{item.name}</Text>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>{item.score}</Text>
        </View>
      </View>

      <Text style={styles.description}>{item.description}</Text>

      <Text style={styles.subTitle}>Why this look:</Text>
      {item.reasons.map((r, index) => (
        <Text key={index} style={styles.reasonText}>
          • {r}
        </Text>
      ))}

      <Text style={styles.subTitle}>Recommended Styles:</Text>
      {item.recommendedStyles.map((s, index) => (
        <Text key={index} style={styles.serviceText}>
          • {s}
        </Text>
      ))}
    </View>
  );

  const renderService = ({ item }: { item: Service }) => (
    <View style={styles.serviceCard}>
      <Text style={styles.serviceName}>{item.name}</Text>
      <Text style={styles.serviceDetails}>
        {item.category.name} • {item.durationMin} min • Rs. {item.priceLkr}
      </Text>

      <Pressable style={styles.bookButton}>
        <Text style={styles.bookButtonText}>Book</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Text style={styles.pageTitle}>Your Recommendations</Text>

        <FlatList
          data={recommendations}
          renderItem={renderRecommendation}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />

        <Text style={[styles.pageTitle, { marginTop: 20 }]}>
          Available Services in This Salon
        </Text>

        <FlatList
          data={matchedServices}
          renderItem={renderService}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.page },
  content: { padding: 16 },

  pageTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#000",
    marginBottom: 12,
  },

  backButton: {
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    borderRadius: 16,
    backgroundColor: colors.card,
  },

  backText: { color: colors.primary, fontWeight: "700" },

  card: {
    backgroundColor: "#000",
    borderRadius: 18,
    padding: 16,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  title: { fontSize: 18, fontWeight: "700", color: colors.text },

  scoreBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  scoreText: { color: colors.white, fontWeight: "700" },

  description: { fontSize: 14, color: colors.textSoft, marginBottom: 8 },

  subTitle: {
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
    marginTop: 8,
  },

  reasonText: { fontSize: 13, color: colors.textSoft, marginLeft: 4 },
  serviceText: { fontSize: 14, color: colors.textSoft, marginLeft: 4 },

  serviceCard: {
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 14,
  },

  serviceName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },

  serviceDetails: {
    fontSize: 13,
    color: colors.textSoft,
    marginTop: 4,
    marginBottom: 8,
  },

  bookButton: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },

  bookButtonText: {
    color: "white",
    fontWeight: "700",
  },
});