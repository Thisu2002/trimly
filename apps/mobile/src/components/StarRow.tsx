// D:\trimly\apps\mobile\src\components\StarRow.tsx

import { Pressable, Text, View } from "react-native";
import { colors } from "../theme/colors";

const STAR_COUNT = 5;

export function StarRow({
  rating,
  onRate,
  size = 28,
  readonly = false,
}: {
  rating: number;
  onRate?: (r: number) => void;
  size?: number;
  readonly?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {Array.from({ length: STAR_COUNT }, (_, i) => {
        const filled = i < rating;
        return (
          <Pressable
            key={i}
            onPress={() => !readonly && onRate?.(i + 1)}
            hitSlop={6}
            disabled={readonly}
          >
            <Text
              style={{
                fontSize: size,
                color: filled ? colors.star : "rgba(255,255,255,0.15)",
                lineHeight: size + 4,
              }}
            >
              ★
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}