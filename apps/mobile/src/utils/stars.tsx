// utils/stars.tsx
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const STAR_COLOR_FILLED = "#F5A623";
const STAR_COLOR_EMPTY  = "#3A3A3A"; // or colors.glassBorder if you import colors here

export function StarRating({
  rating,
  size = 14,
}: {
  rating: number;
  size?: number;
}) {
  const stars = Array.from({ length: 5 }, (_, i) => {
    const filled = rating >= i + 1;
    const half   = !filled && rating >= i + 0.5;
    return (
      <Ionicons
        key={i}
        name={filled ? "star" : half ? "star-half" : "star-outline"}
        size={size}
        color={filled || half ? STAR_COLOR_FILLED : STAR_COLOR_EMPTY}
      />
    );
  });

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
      {stars}
    </View>
  );
}