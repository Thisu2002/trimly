/**
 * FaceScanScreen.tsx
 
 */

import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useRef, useState, useCallback, useEffect } from "react";
import WebView from "react-native-webview";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { colors } from "../theme/colors";
import { detectFaceShape, Landmark } from "../ar/faceShapeDetector";
import { API_BASE_URL } from "../config/api";

type Props = NativeStackScreenProps<RootStackParamList, "FaceScan"> & {
  onScanComplete: (
    faceShape: string,
    landmarks: number[],
    photos: { front: string; left: string; right: string },
  ) => void;
  idToken: string;
  userSub: string | undefined;
};

type ScanStep = "center" | "left" | "right" | "processing" | "done";

const STEP_CONFIG: Record<
  Exclude<ScanStep, "processing" | "done">,
  { label: string; instruction: string; emoji: string }
> = {
  center: {
    label: "Step 1 of 3",
    instruction: "Look straight ahead and capture pose",
    emoji: "😐",
  },
  left: {
    label: "Step 2 of 3",
    instruction: "Slowly turn your head to the LEFT",
    emoji: "👈",
  },
  right: {
    label: "Step 3 of 3",
    instruction: "Slowly turn your head to the RIGHT",
    emoji: "👉",
  },
};

const MEDIAPIPE_HTML = `<!DOCTYPE html>
<html>
<head>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js"
        crossorigin="anonymous"></script>
</head>
<body>
<img id="img" style="display:none"/>
<script>
function post(obj) {
  window.ReactNativeWebView.postMessage(JSON.stringify(obj));
}

let faceMesh;
try {
  faceMesh = new FaceMesh({
    locateFile: (f) => "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/" + f
  });
  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
  faceMesh.onResults((results) => {
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const lms = results.multiFaceLandmarks[0];
      const flat = [];
      for (const lm of lms) { flat.push(lm.x, lm.y, lm.z); }
      post({ type: "landmarks", data: flat });
    } else {
      post({ type: "no_face" });
    }
  });
  post({ type: "ready" });
} catch(e) {
  post({ type: "error", message: "FaceMesh init failed: " + e.message });
}

async function handleFrame(base64) {
  try {
    const img = document.getElementById("img");
    img.src = "data:image/jpeg;base64," + base64;
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
    });
    await faceMesh.send({ image: img });
  } catch(e) {
    post({ type: "error", message: "send failed: " + e.message });
  }
}

// iOS uses document, Android uses window — listen to both
function onMessage(e) {
  try {
    const msg = JSON.parse(e.data);
    if (msg.type === "frame") handleFrame(msg.base64);
  } catch(e) {
    post({ type: "error", message: "parse failed: " + e.message });
  }
}
window.addEventListener("message", onMessage);
document.addEventListener("message", onMessage);
</script>
</body>
</html>`;

export default function FaceScanScreen({ navigation, onScanComplete, idToken, userSub }: Props) {
    const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<ScanStep>("center");
  const [countdown, setCountdown] = useState<number | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const webviewRef = useRef<WebView>(null);

  const landmarkSets = useRef<number[][]>([]);

  const stepRef = useRef<ScanStep>("center");
  const capturedPhotos = useRef<{
    front?: string;
    left?: string;
    right?: string;
  }>({});

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const handleWebViewMessage = useCallback((event: any) => {
    const msg = JSON.parse(event.nativeEvent.data);
    console.log("WebView msg:", msg.type, msg.message ?? "");

    if (msg.type === "ready") {
      console.log("✅ MediaPipe initialized successfully");
    } else if (msg.type === "landmarks") {
      landmarkSets.current.push(msg.data as number[]);
      advanceStep(stepRef.current);
    } else if (msg.type === "no_face") {
      Alert.alert(
        "No face detected",
        "Make sure your face is visible and well-lit.",
      );
      setCountdown(null);
    } else if (msg.type === "error") {
      console.error("WebView error:", msg.message);
      Alert.alert("Scan error", msg.message); // surface it visibly
      setCountdown(null);
    }
  }, []);

  function advanceStep(currentStep: ScanStep) {
    setCountdown(null);
    console.log("Advancing from step:", currentStep);
    if (currentStep === "center") setStep("left");
    else if (currentStep === "left") setStep("right");
    else if (currentStep === "right") {
      setStep("processing");
      processLandmarks();
    }
    console.log("Advancing to step:", step);
  }

  async function processLandmarks() {
    const sets = landmarkSets.current;
    if (sets.length === 0) {
      Alert.alert("Scan failed", "No face data captured. Please try again.");
      setStep("center");
      return;
    }

    const merged: number[] = new Array(sets[0].length).fill(0);
    for (const set of sets) {
      for (let i = 0; i < set.length; i++) {
        merged[i] += set[i] / sets.length;
      }
    }

    const landmarks: Landmark[] = [];
    for (let i = 0; i < merged.length; i += 3) {
      landmarks.push({ x: merged[i], y: merged[i + 1], z: merged[i + 2] });
    }

    const faceShape = detectFaceShape(landmarks);
    const photos = {
      front: capturedPhotos.current.front ?? "",
      left: capturedPhotos.current.left ?? "",
      right: capturedPhotos.current.right ?? "",
    };

    // Convert URIs to base64, save to DB (deletes old + generated automatically via upsert)
    if (userSub && idToken) {
      try {
        const toBase64 = async (uri: string) => {
          const r = await fetch(uri);
          const blob = await r.blob();
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        };
        const [front64, left64, right64] = await Promise.all([
          toBase64(photos.front),
          toBase64(photos.left),
          toBase64(photos.right),
        ]);
        await fetch(`${API_BASE_URL}/api/face-photos/${userSub}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            frontPhoto: front64,
            leftPhoto: left64,
            rightPhoto: right64,
          }),
        });
      } catch (e) {
        console.error("Failed to save face photos:", e);
      }
    }

    setStep("done");
    onScanComplete(faceShape, merged, photos);
  }

  async function captureAndSend() {
    if (!cameraRef.current) return;
    try {
      for (let i = 3; i >= 1; i--) {
        setCountdown(i);
        await new Promise((r) => setTimeout(r, 1000));
      }
      setCountdown(0);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.3,
        base64: true,
        skipProcessing: true,
      });

      if (stepRef.current === "center")
        capturedPhotos.current.front = photo!.uri;
      if (stepRef.current === "left") capturedPhotos.current.left = photo!.uri;
      if (stepRef.current === "right")
        capturedPhotos.current.right = photo!.uri;

      webviewRef.current?.postMessage(
        JSON.stringify({ type: "frame", base64: photo!.base64 }),
      );
    } catch {
      Alert.alert("Capture failed", "Could not take photo. Please try again.");
      setCountdown(null);
    }
  }

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <LinearGradient
        colors={[colors.gradientLeft, colors.gradientRight]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 2, y: 0.5 }}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={styles.safe}>
          <View style={styles.centred}>
            <Text style={styles.permText}>
              Camera access is needed to scan your face shape.
            </Text>
            <Pressable style={styles.btn} onPress={requestPermission}>
              <Text style={styles.btnText}>Grant Permission</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (step === "processing" || step === "done") {
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
            <Text style={styles.processingText}>
              Analysing your face shape…
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const currentConfig = STEP_CONFIG[step as keyof typeof STEP_CONFIG];

  return (
    <LinearGradient
      colors={[colors.gradientLeft, colors.gradientRight]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 2, y: 0.5 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.safe}>
        <WebView
          ref={webviewRef}
          source={{ html: MEDIAPIPE_HTML }}
          onMessage={handleWebViewMessage}
          onError={(e) => console.error("WebView load error:", e.nativeEvent)}
          onHttpError={(e) =>
            console.error("WebView HTTP error:", e.nativeEvent)
          }
          style={styles.hiddenWebview}
          javaScriptEnabled
          originWhitelist={["*"]}
        />

        <View style={styles.page}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>

          <Text style={styles.stepLabel}>{currentConfig.label}</Text>
          <Text style={styles.heading}>Face Scan</Text>
          <Text style={styles.instruction}>{currentConfig.instruction}</Text>

          {/* Camera preview with oval overlay */}
          <View style={styles.cameraWrap}>
            <CameraView ref={cameraRef} style={styles.camera} facing="front" />
            {/* Oval guide overlay */}
            <View style={styles.ovalOverlay}>
              <View style={styles.oval} />
            </View>
            {/* Direction arrow */}
            <View style={styles.emojiWrap}>
              <Text style={styles.dirEmoji}>{currentConfig.emoji}</Text>
            </View>
            {/* Countdown */}
            {countdown !== null && countdown > 0 && (
              <View style={styles.countdownBadge}>
                <Text style={styles.countdownText}>{countdown}</Text>
              </View>
            )}
          </View>

          {/* Step dots */}
          <View style={styles.dotsRow}>
            {(["center", "left", "right"] as const).map((s) => (
              <View
                key={s}
                style={[styles.dot, step === s && styles.dotActive]}
              />
            ))}
          </View>

          <Pressable
            style={[styles.btn, countdown !== null && styles.btnDisabled]}
            onPress={captureAndSend}
            disabled={countdown !== null}
          >
            <Text style={styles.btnText}>
              {countdown !== null && countdown > 0
                ? `Capturing in ${countdown}…`
                : countdown === 0
                  ? "Processing…"
                  : "📸  Capture this pose"}
            </Text>
          </Pressable>

          <Pressable
            style={styles.skipBtn}
            onPress={() =>
              navigation.navigate("Mirror", {
                detectedFaceShape: undefined,
                landmarks: undefined,
              })
            }
          >
            <Text style={styles.skipText}>Skip — fill in manually instead</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  page: { padding: 20 },
  centred: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  permText: {
    fontSize: 15,
    color: colors.text,
    textAlign: "center",
    marginBottom: 24,
  },
  processingText: { marginTop: 16, fontSize: 15, color: colors.textSoft },
  backBtn: { marginBottom: 12 },
  backText: { color: colors.primary, fontWeight: "700", fontSize: 15 },
  stepLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  heading: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  instruction: {
    fontSize: 15,
    color: colors.textSoft,
    marginBottom: 20,
    lineHeight: 22,
  },
  cameraWrap: {
    position: "relative",
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 20,
    backgroundColor: "#000",
  },
  camera: { ...StyleSheet.absoluteFillObject },
  ovalOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  oval: {
    width: "65%",
    height: "80%",
    borderRadius: 999,
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.7)",
    borderStyle: "dashed",
  },
  emojiWrap: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 30,
    padding: 8,
  },
  dirEmoji: { fontSize: 28 },
  countdownBadge: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -36 }, { translateY: -36 }],
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  countdownText: { fontSize: 40, fontWeight: "800", color: "#fff" },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: { backgroundColor: colors.primary, width: 20 },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: colors.white, fontSize: 15, fontWeight: "700" },
  skipBtn: { alignItems: "center", paddingVertical: 8 },
  skipText: { color: colors.textSoft, fontSize: 13 },
  hiddenWebview: { width: 1, height: 1, opacity: 0, position: "absolute" },
});
