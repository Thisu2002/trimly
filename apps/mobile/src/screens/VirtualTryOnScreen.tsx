/**
 * VirtualTryOnScreen.tsx
 */

import {
  Dimensions,
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
import { useState } from "react";
import Svg, { Path, G } from "react-native-svg";
import { RootStackParamList } from "../navigation/RootNavigator";
import { colors } from "../theme/colors";
import {
  HAIR_STYLES_3D,
  HairStyle3D,
  FaceBounds,
  getStylesForFaceShape,
  buildHairPath,
  computeFaceBounds,
} from "../ar/hairStyles3D";

type Props = NativeStackScreenProps<RootStackParamList, "VirtualTryOn"> & {
  faceShape: string;
  landmarks: number[];
  photoUri: string;
};

const PREVIEW_W = Dimensions.get("window").width - 64;
const PREVIEW_H = PREVIEW_W * (4 / 3);

type GenderFilter = "female" | "male";

function computeHairAssetBounds(
  style: HairStyle3D,
  face: FaceBounds,
) {
  const { offsetY, offsetX, widthScale, heightScale } = style.asset;
  const assetW = face.faceWidth  * widthScale;
  const assetH = face.faceHeight * heightScale;
  const faceCentreX = face.faceLeft + face.faceWidth / 2;
  const left = faceCentreX - assetW / 2 + face.faceWidth * offsetX;
  const top  = face.faceTop + face.faceHeight * offsetY;
  return { top, left, width: assetW, height: assetH };
}

export default function VirtualTryOnScreen({
  navigation,
  faceShape,
  landmarks,
  photoUri,
}: Props) {
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("female");
  const [showAll,      setShowAll]      = useState(false);

  // Filter by gender first, then optionally by face shape
  const byGender     = HAIR_STYLES_3D.filter((s) => s.gender === genderFilter);
  const recommended  = byGender.filter((s) => s.suitableFaceShapes.includes(faceShape));
  const displayStyles = showAll
    ? byGender
    : recommended.length > 0 ? recommended : byGender;

  const [selected, setSelected] = useState<HairStyle3D>(displayStyles[0]);

  const faceBounds = computeFaceBounds(landmarks, PREVIEW_W, PREVIEW_H);
  const hairPath   = buildHairPath(landmarks, selected, PREVIEW_W, PREVIEW_H);
  const hairAsset  = computeHairAssetBounds(selected, faceBounds);

  const ovalTop    = faceBounds.faceTop    - PREVIEW_H * 0.01;
  const ovalLeft   = faceBounds.faceLeft   - PREVIEW_W * 0.01;
  const ovalWidth  = faceBounds.faceWidth  + PREVIEW_W * 0.02;
  const ovalHeight = faceBounds.faceHeight + PREVIEW_H * 0.02;

  // When gender switches, reset selection to first in new list
  function switchGender(g: GenderFilter) {
    setGenderFilter(g);
    const next = HAIR_STYLES_3D.filter((s) => s.gender === g);
    if (next.length > 0) setSelected(next[0]);
  }

  return (
    <LinearGradient
      colors={[colors.gradientLeft, colors.gradientRight]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 2, y: 0.5 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.page}>

            <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </Pressable>

            <Text style={styles.heading}>Virtual Try-On</Text>
            <Text style={styles.sub}>
              Your face shape:{" "}
              <Text style={styles.accent}>{faceShape}</Text>
            </Text>

            {/* ── Gender toggle ── */}
            <View style={styles.genderRow}>
              <Pressable
                style={[styles.genderBtn, genderFilter === "female" && styles.genderBtnActive]}
                onPress={() => switchGender("female")}
              >
                <Text style={[styles.genderBtnText, genderFilter === "female" && styles.genderBtnTextActive]}>
                  ♀  Female
                </Text>
              </Pressable>
              <Pressable
                style={[styles.genderBtn, genderFilter === "male" && styles.genderBtnActive]}
                onPress={() => switchGender("male")}
              >
                <Text style={[styles.genderBtnText, genderFilter === "male" && styles.genderBtnTextActive]}>
                  ♂  Male
                </Text>
              </Pressable>
            </View>

            {/* ── Photo + hair overlay ── */}
            <View style={[styles.photoWrap, { width: PREVIEW_W, height: PREVIEW_H }]}>

              {/* Layer 1 — full photo background */}
              {photoUri ? (
                <Image
                  source={{ uri: photoUri }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
              ) : (
                <View style={[StyleSheet.absoluteFill, styles.photoPlaceholder]}>
                  <Text style={{ color: colors.textSoft, fontSize: 13 }}>
                    No photo captured
                  </Text>
                </View>
              )}

              {/* Layer 2 — hair PNG or SVG fallback */}
              {selected.assetUri ? (
                <Image
                  source={selected.assetUri}
                  style={[
                    styles.hairPng,
                    {
                      top:    hairAsset.top,
                      left:   hairAsset.left,
                      width:  hairAsset.width,
                      height: hairAsset.height,
                    },
                  ]}
                  resizeMode="stretch"
                />
              ) : (
                <Svg
                  width={PREVIEW_W}
                  height={PREVIEW_H}
                  style={StyleSheet.absoluteFill}
                >
                  <G opacity={0.9}>
                    <Path d={hairPath} fill="#4a3728" stroke="#4a3728" strokeWidth={2} />
                  </G>
                </Svg>
              )}

              {/* Layer 3 — face photo clipped to oval, on top of hair */}
              {photoUri ? (
                <View
                  style={[
                    styles.faceOvalClip,
                    {
                      top:          ovalTop,
                      left:         ovalLeft,
                      width:        ovalWidth,
                      height:       ovalHeight,
                      borderRadius: ovalWidth * 0.55,
                    },
                  ]}
                >
                  <Image
                    source={{ uri: photoUri }}
                    style={{
                      width:      PREVIEW_W,
                      height:     PREVIEW_H,
                      marginLeft: -ovalLeft,
                      marginTop:  -ovalTop,
                    }}
                    resizeMode="cover"
                  />
                </View>
              ) : null}

              {/* Style name badge */}
              <View style={styles.styleNameBadge}>
                <Text style={styles.styleNameText}>{selected.name}</Text>
              </View>
            </View>

            {/* ── Style picker ── */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>Styles</Text>
              <Pressable onPress={() => setShowAll((v) => !v)}>
                <Text style={styles.toggleText}>
                  {showAll ? "Recommended only" : "Show all"}
                </Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.styleScroll}
            >
              {displayStyles.map((style) => (
                <Pressable
                  key={style.id}
                  style={[
                    styles.styleChip,
                    selected.id === style.id && styles.styleChipSelected,
                  ]}
                  onPress={() => setSelected(style)}
                >
                  <Text
                    style={[
                      styles.styleChipText,
                      selected.id === style.id && styles.styleChipTextSelected,
                    ]}
                  >
                    {style.name}
                  </Text>
                  <Text style={styles.styleLength}>{style.category}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* ── Description card ── */}
            <View style={styles.descCard}>
              <Text style={styles.descTitle}>{selected.name}</Text>
              <Text style={styles.descText}>{selected.description}</Text>
            </View>

            {/* ── CTAs ── */}
            <Pressable
              style={styles.primaryBtn}
              onPress={() =>
                navigation.navigate("Mirror", {
                  detectedFaceShape: faceShape,
                  landmarks,
                })
              }
            >
              <Text style={styles.primaryBtnText}>
                Continue to full profile →
              </Text>
            </Pressable>

            <Pressable
              style={styles.secondaryBtn}
              onPress={() => navigation.navigate("StyleRecommendation")}
            >
              <Text style={styles.secondaryBtnText}>
                Get salon recommendations →
              </Text>
            </Pressable>

          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  page: {
    backgroundColor: colors.page,
    borderRadius: 24,
    padding: 18,
    minHeight: "100%",
  },
  backBtn:  { marginBottom: 16 },
  backText: { color: colors.primary, fontWeight: "700", fontSize: 15 },
  heading:  { fontSize: 26, fontWeight: "800", color: colors.text, marginBottom: 4 },
  sub:      { fontSize: 14, color: colors.textSoft, marginBottom: 16 },
  accent:   { color: colors.primary, fontWeight: "700", textTransform: "capitalize" },

  // Gender toggle
  genderRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
  },
  genderBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  genderBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textSoft,
  },
  genderBtnTextActive: {
    color: colors.white,
  },

  photoWrap: {
    alignSelf: "center",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 24,
    backgroundColor: colors.card,
    position: "relative",
  },
  photoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  hairPng: {
    position: "absolute",
  },
  faceOvalClip: {
    position: "absolute",
    overflow: "hidden",
  },
  styleNameBadge: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  styleNameText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  toggleText: { fontSize: 12, color: colors.primary, fontWeight: "700" },

  styleScroll: { gap: 10, paddingBottom: 4, marginBottom: 20 },
  styleChip: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 16, borderWidth: 1.5,
    borderColor: colors.border, backgroundColor: colors.card,
    minWidth: 100, alignItems: "center",
  },
  styleChipSelected: {
    borderColor: colors.primary, backgroundColor: colors.primary,
  },
  styleChipText: {
    fontSize: 13, fontWeight: "700",
    color: colors.textSoft, textAlign: "center",
  },
  styleChipTextSelected: { color: colors.white },
  styleLength: { fontSize: 10, color: colors.textSoft, marginTop: 2 },

  descCard: {
    backgroundColor: colors.card, borderRadius: 16,
    padding: 14, marginBottom: 20,
  },
  descTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 4 },
  descText:  { fontSize: 13, color: colors.textSoft, lineHeight: 20 },

  primaryBtn: {
    backgroundColor: colors.primary, borderRadius: 20,
    paddingVertical: 14, alignItems: "center", marginBottom: 10,
  },
  primaryBtnText:  { color: colors.white, fontSize: 15, fontWeight: "700" },
  secondaryBtn: {
    borderWidth: 1.5, borderColor: colors.primary,
    borderRadius: 20, paddingVertical: 13, alignItems: "center",
  },
  secondaryBtnText: { color: colors.primary, fontSize: 15, fontWeight: "700" },
});