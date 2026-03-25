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
  recommendedServices: string[]; // array of service names
  reasons: string[];
  score: number;
};

type Props = {
  recommendations: Recommendation[];
  onBack: () => void;
};

export default function RecommendationScreen({ recommendations, onBack }: Props) {
  const renderItem = ({ item }: { item: Recommendation }) => (
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
        <Text key={index} style={styles.reasonText}>• {r}</Text>
      ))}

      <Text style={styles.subTitle}>Recommended Services:</Text>
      {item.recommendedServices.map((s, index) => (
        <Text key={index} style={styles.serviceText}>• {s}</Text>
      ))}
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
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.page }, // uses home page background
  content: { padding: 16 },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#000",
    marginBottom: 16,
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
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  title: { fontSize: 18, fontWeight: "700", color: colors.text },
  scoreBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  scoreText: { color: colors.white, fontWeight: "700" },

  description: { fontSize: 14, color: colors.textSoft, marginBottom: 8 },
  subTitle: { fontWeight: "700", color: colors.text, marginBottom: 4, marginTop: 8 },
  reasonText: { fontSize: 13, color: colors.textSoft, marginLeft: 4 },
  serviceText: { fontSize: 14, color: colors.textSoft, marginLeft: 4 },
});