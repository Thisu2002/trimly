/**
 * MirrorScreen.tsx
 *
 * Virtual mirror with two modes:
 *  1. CAMERA MODE  — live camera feed. In a production build you'd layer
 *     react-native-vision-camera + @shopify/react-native-skia + a TFLite
 *     face-landmark model here to draw hair overlays and auto-detect face shape.
 *     The scaffold below shows exactly where those pieces slot in.
 *
 *  2. MANUAL MODE  — a quick questionnaire for hairType, hairLength, styleGoal
 *     (and faceShape if camera detection is unavailable / skipped).
 *
 * After the user confirms their profile it is:
 *  • Saved to the backend via PUT /hair-profile
 *  • Then the app navigates to StyleRecommendationScreen which fetches results.
 *
 * ─── Dependencies you need to install for full camera support ─────────────────
 *   npx expo install react-native-vision-camera
 *   npx expo install @shopify/react-native-skia
 *   npx expo install react-native-fast-tflite          ← for face landmark model
 *   npx expo install expo-camera                       ← permissions helper
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { colors } from "../theme/colors";
import { API_BASE_URL } from "../config/api";
import { HairProfile } from "../types/salon";

// ─── Swap this import in when you add react-native-vision-camera ──────────────
// import { Camera, useCameraDevice } from "react-native-vision-camera";
// import { useSkiaFrameProcessor } from "react-native-vision-camera";
// import { drawHairOverlay } from "../ar/hairOverlays";   ← your Skia overlay
// import { detectFaceShape } from "../ar/faceShape";       ← your landmark logic
// ─────────────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<RootStackParamList, "Mirror"> & {
  idToken: string;
  userSub: string | undefined;
};

type Step = "camera" | "questionnaire" | "saving";

const FACE_SHAPES = ["oval", "round", "square", "heart", "diamond", "oblong"] as const;
const HAIR_TYPES  = ["straight", "wavy", "curly", "coily"] as const;
const HAIR_LENGTHS = ["short", "medium", "long"] as const;
const STYLE_GOALS = [
  { value: "low_maintenance", label: "Low Maintenance" },
  { value: "trendy",          label: "Trendy" },
  { value: "professional",    label: "Professional" },
  { value: "volume",          label: "More Volume" },
  { value: "repair",          label: "Repair & Restore" },
] as const;

function OptionRow<T extends string>({
  label,
  options,
  selected,
  onSelect,
  labelMap,
}: {
  label: string;
  options: readonly T[];
  selected: T | null;
  onSelect: (v: T) => void;
  labelMap?: Record<T, string>;
}) {
  return (
    <View style={q.group}>
      <Text style={q.groupLabel}>{label}</Text>
      <View style={q.chips}>
        {options.map((opt) => (
          <Pressable
            key={opt}
            style={[q.chip, selected === opt && q.chipSelected]}
            onPress={() => onSelect(opt)}
          >
            <Text style={[q.chipText, selected === opt && q.chipTextSelected]}>
              {labelMap ? labelMap[opt] : opt}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function MirrorScreen({ navigation, idToken, userSub }: Props) {
  const [step, setStep] = useState<Step>("camera");

  // Profile fields
  const [faceShape, setFaceShape]   = useState<string | null>(null);
  const [hairType, setHairType]     = useState<string | null>(null);
  const [hairLength, setHairLength] = useState<string | null>(null);
  const [styleGoal, setStyleGoal]   = useState<string | null>(null);

  // ── CAMERA STEP ─────────────────────────────────────────────────────────────
  // When you integrate react-native-vision-camera:
  //
  //   const device = useCameraDevice("front");
  //   const frameProcessor = useSkiaFrameProcessor((frame) => {
  //     "worklet";
  //     const landmarks = detectFaceLandmarks(frame);   // TFLite call
  //     if (landmarks) {
  //       const detected = detectFaceShape(landmarks);  // your ratio logic
  //       runOnJS(setFaceShape)(detected);
  //       drawHairOverlay(frame, landmarks, selectedStyle); // Skia draw
  //     }
  //   }, [selectedStyle]);
  //
  //   return (
  //     <Camera
  //       style={StyleSheet.absoluteFill}
  //       device={device}
  //       isActive
  //       frameProcessor={frameProcessor}
  //     />
  //   );
  // ───────────────────────────────────────────────────────────────────────────

  async function handleSaveAndRecommend() {
    if (!faceShape || !hairType || !hairLength || !styleGoal) {
      Alert.alert("Almost there", "Please fill in all fields before continuing.");
      return;
    }

    setStep("saving");

    const profile: HairProfile = {
      faceShape,
      hairType,
      hairLength,
      styleGoal,
      previousServices: [], // populated server-side from appointment history
      detectionMethod: "manual", // change to "mirror" when camera detection is live
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/hair-profile/${userSub}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(profile),
      });

      if (!res.ok) throw new Error(`Save failed: ${res.status}`);

      // Profile saved — StyleRecommendationScreen will fetch it fresh
      navigation.replace("StyleRecommendation");
    } catch (error) {
      console.error(error);
      setStep("questionnaire");
      Alert.alert("Error", "Could not save your profile. Please try again.");
    }
  }

  // ── SAVING STATE ────────────────────────────────────────────────────────────
  if (step === "saving") {
    return (
      <LinearGradient
        colors={[colors.gradientLeft, colors.gradientRight]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 2, y: 0.5 }}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={styles.safe}>
          <View style={styles.centred}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.savingText}>Saving your profile…</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── CAMERA STEP (scaffold) ──────────────────────────────────────────────────
  if (step === "camera") {
    return (
      <LinearGradient
        colors={[colors.gradientLeft, colors.gradientRight]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 2, y: 0.5 }}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={styles.safe}>
          <View style={styles.cameraPage}>
            <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </Pressable>

            <Text style={styles.heading}>Virtual Mirror</Text>

            {/* ── Camera placeholder ─────────────────────────────────────────
                Replace this View with <Camera> from react-native-vision-camera
                once installed. The frame processor will detect face shape and
                draw Skia hair overlays live on the feed.
            ─────────────────────────────────────────────────────────────────── */}
            <View style={styles.cameraPlaceholder}>
              <Text style={styles.cameraEmoji}>🪞</Text>
              <Text style={styles.cameraPlaceholderTitle}>Camera coming soon</Text>
              <Text style={styles.cameraPlaceholderSub}>
                Install react-native-vision-camera +{"\n"}
                @shopify/react-native-skia to enable live{"\n"}
                hair style try-on and face shape detection.
              </Text>
            </View>

            {/* When face shape is auto-detected, show it here */}
            {faceShape && (
              <View style={styles.detectedPill}>
                <Text style={styles.detectedText}>
                  Detected face shape: <Text style={{ fontWeight: "800" }}>{faceShape}</Text>
                </Text>
              </View>
            )}

            <Pressable
              style={styles.primaryButton}
              onPress={() => setStep("questionnaire")}
            >
              <Text style={styles.primaryButtonText}>
                {faceShape ? "Continue to questionnaire →" : "Skip to questionnaire →"}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── QUESTIONNAIRE STEP ──────────────────────────────────────────────────────
  const goalLabelMap = Object.fromEntries(
    STYLE_GOALS.map((g) => [g.value, g.label])
  ) as Record<string, string>;

  const ready = faceShape && hairType && hairLength && styleGoal;

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
            <Pressable onPress={() => setStep("camera")} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </Pressable>

            <Text style={styles.heading}>Your Hair Profile</Text>
            <Text style={styles.subheading}>
              This helps us personalise style recommendations for you.
            </Text>

            <OptionRow
              label="Face shape"
              options={FACE_SHAPES}
              selected={faceShape as any}
              onSelect={setFaceShape}
            />
            <OptionRow
              label="Hair type"
              options={HAIR_TYPES}
              selected={hairType as any}
              onSelect={setHairType}
            />
            <OptionRow
              label="Hair length"
              options={HAIR_LENGTHS}
              selected={hairLength as any}
              onSelect={setHairLength}
            />
            <OptionRow
              label="Style goal"
              options={STYLE_GOALS.map((g) => g.value) as unknown as readonly string[]}
              selected={styleGoal}
              onSelect={setStyleGoal}
              labelMap={goalLabelMap as any}
            />

            <Pressable
              style={[styles.primaryButton, !ready && styles.primaryButtonDisabled]}
              onPress={handleSaveAndRecommend}
              disabled={!ready}
            >
              <Text style={styles.primaryButtonText}>
                Save & Get Recommendations →
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ── Questionnaire chip styles ─────────────────────────────────────────────────
const q = StyleSheet.create({
  group: { marginBottom: 22 },
  groupLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: colors.textSoft,
    textTransform: "capitalize",
    fontWeight: "600",
  },
  chipTextSelected: { color: colors.white },
});

// ── Screen-level styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  page: {
    backgroundColor: colors.page,
    borderRadius: 24,
    padding: 18,
    minHeight: "100%",
  },
  centred: { flex: 1, alignItems: "center", justifyContent: "center" },
  savingText: {
    marginTop: 16,
    fontSize: 15,
    color: colors.textSoft,
  },
  backBtn: { marginBottom: 16 },
  backText: { color: colors.primary, fontWeight: "700", fontSize: 15 },
  heading: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    color: colors.textSoft,
    marginBottom: 28,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonDisabled: { opacity: 0.4 },
  primaryButtonText: { color: colors.white, fontSize: 15, fontWeight: "700" },

  // Camera placeholder
  cameraPage: {
    flex: 1,
    backgroundColor: colors.page,
    padding: 20,
  },
  cameraPlaceholder: {
    flex: 1,
    margin: 10,
    borderRadius: 24,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  cameraEmoji: { fontSize: 56, marginBottom: 16 },
  cameraPlaceholderTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 10,
    textAlign: "center",
  },
  cameraPlaceholderSub: {
    fontSize: 13,
    color: colors.textSoft,
    textAlign: "center",
    lineHeight: 20,
  },
  detectedPill: {
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  detectedText: { fontSize: 13, color: colors.text },
});