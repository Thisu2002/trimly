import {
  ActivityIndicator,
  Alert,
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
import { useState, useRef } from "react";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system/legacy";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "../navigation/RootNavigator";
import { colors } from "../theme/colors";
import { API_BASE_URL } from "../config/api";
import { HAIR_STYLES_3D, HairStyle3D } from "../ar/hairStyles3D";

type Props = NativeStackScreenProps<RootStackParamList, "VirtualTryOn"> & {
  faceShape: string;
  landmarks: number[];
  photos: { front: string; left: string; right: string };
};

type ViewTab = "front" | "left" | "right";

const PREVIEW_W = Dimensions.get("window").width - 64;
const PREVIEW_H = PREVIEW_W * (4 / 3);

type GeneratedImages = {
  front?: string;
  left?: string;
  right?: string;
};

export default function VirtualTryOnScreen({
  navigation,
  route,
  faceShape,
  landmarks,
}: Props) {
  const photos = route.params.photos;
  const userSub = route.params.userSub;
  const idToken = route.params.idToken;

  const [genderFilter, setGenderFilter] = useState<"female" | "male">("female");
  const [activeView, setActiveView] = useState<ViewTab>("front");
  const [selected, setSelected] = useState<HairStyle3D | null>(null);
  const [showAll, setShowAll] = useState(false);

  const cache = useRef<Record<string, GeneratedImages>>({});
  const [generated, setGenerated] = useState<GeneratedImages>({});
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();

  const byGender = HAIR_STYLES_3D.filter((s) => s.gender === genderFilter);
  const recommended = byGender.filter((s) =>
    s.suitableFaceShapes.includes(faceShape),
  );
  const displayStyles = showAll
    ? byGender
    : recommended.length > 0
      ? recommended
      : byGender;

  function switchGender(g: "female" | "male") {
    setGenderFilter(g);
    setSelected(null);
    setGenerated({});
    setError(null);
  }

  async function selectStyle(style: HairStyle3D) {
    setSelected(style);
    setError(null);

    if (cache.current[style.id]) {
      setGenerated(cache.current[style.id]);
      return;
    }

    setGenerated({});
    setGenerating(true);

    try {
      const [frontB64, leftB64, rightB64] = await Promise.all([
        uriToBase64(photos.front),
        uriToBase64(photos.left),
        uriToBase64(photos.right),
      ]);

      const res = await fetch(`${API_BASE_URL}/api/hair-generate/generate-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photos: { front: frontB64, left: leftB64, right: rightB64 },
          styleId: style.id,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json();
      const result: GeneratedImages = {
        front: data.front,
        left: data.left,
        right: data.right,
      };

      cache.current[style.id] = result;
      setGenerated(result);
    } catch (e: any) {
      console.error("❌ selectStyle error:", e?.message ?? e);
      setError("Generation failed. Check your connection and try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function uriToBase64(uri: string): Promise<string> {
    if (uri.startsWith("data:")) return uri.split(",")[1];
    if (!uri.startsWith("http")) {
      return await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function downloadCurrentPhoto() {
    const uriToSave = generated[activeView] ?? photos[activeView];
    if (!uriToSave) return;

    setDownloading(true);
    try {
      if (!mediaPermission?.granted) {
        const { granted } = await requestMediaPermission();
        if (!granted) {
          Alert.alert("Permission needed", "Allow access to save photos to your gallery.");
          return;
        }
      }

      let localUri: string;

      if (uriToSave.startsWith("data:")) {
        const base64Data = uriToSave.split(",")[1];
        const filename = `trimly_${selected?.id ?? "photo"}_${activeView}_${Date.now()}.png`;
        const tempPath = `${FileSystem.cacheDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(tempPath, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        localUri = tempPath;
      } else {
        const filename = `trimly_${activeView}_${Date.now()}.jpg`;
        const tempPath = `${FileSystem.cacheDirectory}${filename}`;
        const downloadResult = await FileSystem.downloadAsync(uriToSave, tempPath);
        localUri = downloadResult.uri;
      }

      await MediaLibrary.saveToLibraryAsync(localUri);
      Alert.alert("Saved!", "Photo saved to your gallery.");
    } catch (e: any) {
      console.error("Download error:", e);
      Alert.alert("Save failed", "Could not save the photo. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  const activeOriginal = photos[activeView];
  const activeGenerated = generated[activeView];
  const canDownload = !generating && (!!activeGenerated || !!activeOriginal);

  const VIEW_TABS: { key: ViewTab; label: string }[] = [
    { key: "front", label: "Front" },
    { key: "left", label: "Left" },
    { key: "right", label: "Right" },
  ];

  // Badge state
  const badgeIcon: keyof typeof Ionicons.glyphMap = generating
    ? "hourglass-outline"
    : activeGenerated
      ? "sparkles-outline"
      : "camera-outline";
  const badgeLabel = generating
    ? "Generating…"
    : activeGenerated
      ? "AI Generated"
      : "Original";

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
              {(["female", "male"] as const).map((g) => (
                <Pressable
                  key={g}
                  style={[styles.genderBtn, genderFilter === g && styles.genderBtnActive]}
                  onPress={() => switchGender(g)}
                >
                  <Ionicons
                    name={g === "female" ? "person-outline" : "man-outline"}
                    size={15}
                    color={genderFilter === g ? colors.white : colors.textSoft}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.genderBtnText,
                      genderFilter === g && styles.genderBtnTextActive,
                    ]}
                  >
                    {g === "female" ? "Female" : "Male"}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* ── View tabs ── */}
            <View style={styles.viewTabRow}>
              {VIEW_TABS.map((tab) => (
                <Pressable
                  key={tab.key}
                  style={[styles.viewTab, activeView === tab.key && styles.viewTabActive]}
                  onPress={() => setActiveView(tab.key)}
                >
                  <Text
                    style={[
                      styles.viewTabText,
                      activeView === tab.key && styles.viewTabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* ── Photo preview ── */}
            <View style={[styles.photoWrap, { width: PREVIEW_W, height: PREVIEW_H }]}>
              <Image
                source={{ uri: activeOriginal }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />

              {activeGenerated && !generating && (
                <Image
                  source={{ uri: activeGenerated }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
              )}

              {generating && (
                <View style={styles.generatingOverlay}>
                  <ActivityIndicator size="small" color={colors.primaryLight} />
                  <Text style={styles.generatingText}>Generating {activeView} view…</Text>
                  <Text style={styles.generatingHint}>Processing 3 views — takes ~30s</Text>
                </View>
              )}

              {error && !generating && (
                <View style={styles.generatingOverlay}>
                  <Ionicons name="warning-outline" size={28} color="#ff6b6b" />
                  <Text style={styles.errorText}>{error}</Text>
                  <Pressable style={styles.retryBtn} onPress={() => selected && selectStyle(selected)}>
                    <Text style={styles.retryBtnText}>Retry</Text>
                  </Pressable>
                </View>
              )}

              {/* Status badge — top left */}
              <View style={styles.previewBadge}>
                <Ionicons name={badgeIcon} size={12} color="#fff" style={{ marginRight: 5 }} />
                <Text style={styles.previewBadgeText}>{badgeLabel}</Text>
              </View>

              {/* Style name badge — bottom centre, only when a style is selected */}
              {selected && (
                <View style={styles.styleNameBadge}>
                  <Text style={styles.styleNameText}>{selected.name}</Text>
                </View>
              )}

              {/* No style selected hint — bottom centre */}
              {!selected && !generating && (
                <View style={styles.hintBadge}>
                  <Ionicons name="hand-left-outline" size={12} color="rgba(255,255,255,0.7)" style={{ marginRight: 5 }} />
                  <Text style={styles.hintBadgeText}>Tap a style below to try it on</Text>
                </View>
              )}

              {/* Download button — top right */}
              {canDownload && (
                <Pressable
                  style={styles.downloadBtn}
                  onPress={downloadCurrentPhoto}
                  disabled={downloading}
                >
                  {downloading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="download-outline" size={18} color="#fff" />
                  )}
                </Pressable>
              )}
            </View>

            {/* ── Thumbnail strip (only when generated) ── */}
            {!generating && (generated.front || generated.left || generated.right) && (
              <View style={styles.thumbRow}>
                {VIEW_TABS.map((tab) => (
                  <Pressable
                    key={tab.key}
                    style={[styles.thumb, activeView === tab.key && styles.thumbActive]}
                    onPress={() => setActiveView(tab.key)}
                  >
                    <Image
                      source={{ uri: generated[tab.key] ?? photos[tab.key] }}
                      style={styles.thumbImage}
                      resizeMode="cover"
                    />
                    <Text style={styles.thumbLabel}>{tab.label}</Text>
                  </Pressable>
                ))}
              </View>
            )}

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
                    selected?.id === style.id && styles.styleChipSelected,
                  ]}
                  onPress={() => selectStyle(style)}
                >
                  <Text
                    style={[
                      styles.styleChipText,
                      selected?.id === style.id && styles.styleChipTextSelected,
                    ]}
                  >
                    {style.name}
                  </Text>
                  <Text
                    style={[
                      styles.styleLength,
                      selected?.id === style.id && styles.styleLengthSelected,
                    ]}
                  >
                    {style.category}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* ── Description card (only when selected) ── */}
            {selected && (
              <View style={styles.descCard}>
                <View style={styles.descHeader}>
                  <Ionicons name="sparkles-outline" size={15} color={colors.primary} style={{ marginRight: 7 }} />
                  <Text style={styles.descTitle}>{selected.name}</Text>
                </View>
                <Text style={styles.descText}>{selected.description}</Text>
              </View>
            )}

            {/* ── CTAs ── */}
            <View style={styles.ctaStack}>
              <Pressable
                style={styles.primaryBtn}
                onPress={() =>
                  navigation.navigate("Mirror", {
                    detectedFaceShape: faceShape,
                    landmarks,
                  })
                }
              >
                <Text style={styles.primaryBtnText}>Continue to full profile</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.white} style={{ marginLeft: 6 }} />
              </Pressable>

              <View style={styles.secondaryRow}>
                <Pressable
                  style={[styles.secondaryBtn, { flex: 1 }]}
                  onPress={() => navigation.navigate("FaceScan")}
                >
                  <Ionicons name="refresh-outline" size={15} color={colors.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.secondaryBtnText}>Scan again</Text>
                </Pressable>

                <Pressable
                  style={[styles.secondaryBtn, { flex: 1 }]}
                  onPress={() => navigation.navigate("StyleRecommendation")}
                >
                  <Text style={styles.secondaryBtnText}>Recommendations</Text>
                  <Ionicons name="arrow-forward" size={15} color={colors.primary} style={{ marginLeft: 6 }} />
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const THUMB_SIZE = (Dimensions.get("window").width - 96) / 3;

const styles = StyleSheet.create({
  safe: { flex: 1, marginBottom: 16 },
  content: { padding: 10, paddingBottom: 40 },
  page: {
    backgroundColor: colors.page,
    borderRadius: 24,
    padding: 15,
    minHeight: "100%",
  },
  backBtn: { marginBottom: 16 },
  backText: { color: colors.primary, fontWeight: "700", fontSize: 15 },
  heading: { fontSize: 26, fontWeight: "800", color: colors.text, marginBottom: 4 },
  sub: { fontSize: 14, color: colors.textSoft, marginBottom: 16 },
  accent: { color: colors.primary, fontWeight: "700", textTransform: "capitalize" },

  // Gender toggle
  genderRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  genderBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  genderBtnActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  genderBtnText: { fontSize: 14, fontWeight: "700", color: colors.textSoft },
  genderBtnTextActive: { color: colors.white },

  // View tabs
  viewTabRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  viewTab: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
  },
  viewTabActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}22`,
  },
  viewTabText: { fontSize: 13, fontWeight: "600", color: colors.textSoft },
  viewTabTextActive: { color: colors.primary, fontWeight: "700" },

  // Photo preview
  photoWrap: {
    alignSelf: "center",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: colors.card,
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(171,213,255,0.12)",
  },
  generatingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  generatingText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  generatingHint: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  errorText: {
    color: "#ff6b6b",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 24,
    marginTop: 8,
  },
  retryBtn: {
    marginTop: 4,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  retryBtnText: { color: colors.white, fontWeight: "700", fontSize: 14 },

  // Status badge — top left
  previewBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(171,213,255,0.15)",
  },
  previewBadgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },

  // Style name badge — bottom centre
  styleNameBadge: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  styleNameText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  hintBadge: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  hintBadgeText: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "600" },

  // Download button — top right
  downloadBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 10,
    padding: 9,
    borderWidth: 1,
    borderColor: "rgba(171,213,255,0.15)",
  },

  // Thumbnails
  thumbRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
    justifyContent: "center",
  },
  thumb: {
    width: THUMB_SIZE,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbActive: { borderColor: colors.primary },
  thumbImage: { width: "100%", height: THUMB_SIZE * 1.2 },
  thumbLabel: {
    textAlign: "center",
    fontSize: 11,
    color: colors.textSoft,
    paddingVertical: 4,
    backgroundColor: colors.card,
  },

  // Section header
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSoft,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  toggleText: { fontSize: 12, color: colors.primary, fontWeight: "700" },

  // Style chips
  styleScroll: { gap: 10, paddingBottom: 4, marginBottom: 15 },
  styleChip: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    minWidth: 100,
    alignItems: "center",
  },
  styleChipSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  styleChipText: { fontSize: 13, fontWeight: "700", color: colors.textSoft, textAlign: "center" },
  styleChipTextSelected: { color: colors.white },
  styleLength: { fontSize: 10, color: colors.textSoft, marginTop: 3 },
  styleLengthSelected: { color: "rgba(255,255,255,0.7)" },

  // Description card
  descCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(171,213,255,0.1)",
  },
  descHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  descTitle: { fontSize: 15, fontWeight: "700", color: colors.text },
  descText: { fontSize: 13, color: colors.textSoft, lineHeight: 20 },

  // CTAs
  ctaStack: { gap: 10 },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: colors.white, fontSize: 13, fontWeight: "700" },
  secondaryRow: { flexDirection: "row", gap: 10 },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 12,
  },
  secondaryBtnText: { color: colors.primary, fontSize: 13, fontWeight: "700" },
});