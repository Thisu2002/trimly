// D:\trimly\apps\mobile\src\screens\ProfileSetupScreen.tsx
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { colors } from "../theme/colors";
import { AuthUser } from "../types/auth";
import { API_BASE_URL } from "../config/api";

type Props = {
  user: AuthUser | null;
  idToken: string | null;
  onComplete: () => void; // called after save (or skip) — navigates into main app
};

export default function ProfileSetupScreen({ user, idToken, onComplete }: Props) {
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!idToken) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ name, phone, address }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      onComplete();
    } catch (err) {
      console.warn("[ProfileSetupScreen] save failed:", err);
      Alert.alert("Save failed", "Could not save your profile. You can update it later in the Profile tab.");
      onComplete(); // let them in anyway
    } finally {
      setSaving(false);
    }
  }

  return (
    <LinearGradient
      colors={[colors.gradientLeft, colors.gradientRight]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 2, y: 0.5 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Icon + greeting ── */}
            <View style={styles.topBlock}>
              <View style={styles.iconCircle}>
                <Ionicons name="person-add-outline" size={34} color={colors.primaryLight} />
              </View>
              <Text style={styles.title}>Welcome to Trimly</Text>
              <Text style={styles.subtitle}>
                Let's set up your profile so salons{"\n"}know how to reach you.
              </Text>
            </View>

            {/* ── Fields ── */}
            <View style={styles.card}>
              <Field
                label="Full Name"
                icon="person-outline"
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
              />
              <Divider />
              <Field
                label="Phone Number"
                icon="call-outline"
                value={phone}
                onChangeText={setPhone}
                placeholder="e.g. +94 77 123 4567"
                keyboardType="phone-pad"
              />
              <Divider />
              <Field
                label="Address"
                icon="location-outline"
                value={address}
                onChangeText={setAddress}
                placeholder="Your city or address"
              />
            </View>

            <Text style={styles.note}>
              <Ionicons name="information-circle-outline" size={12} color={colors.textMuted} />
              {"  "}You can always update this later from the Profile tab.
            </Text>

            {/* ── CTA ── */}
            <Pressable
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Text style={styles.saveBtnText}>Save & Continue</Text>
                  <Ionicons name="arrow-forward" size={17} color={colors.white} />
                </>
              )}
            </Pressable>

            {/* ── Skip ── */}
            <Pressable style={styles.skipBtn} onPress={onComplete}>
              <Text style={styles.skipText}>Skip for now</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "phone-pad" | "email-address";
}) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldIcon}>
        <Ionicons name={icon} size={16} color={colors.primaryLight} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput
          style={styles.fieldInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          autoCapitalize="none"
        />
      </View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 40 },

  topBlock: { alignItems: "center", marginBottom: 36, gap: 12 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(42,79,122,0.5)",
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },

  card: {
    backgroundColor: "rgba(20,28,45,0.6)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingVertical: 8,
    marginBottom: 14,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  fieldIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(171,213,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  fieldInput: {
    fontSize: 15,
    color: colors.text,
    padding: 0, // remove default Android padding
  },
  divider: {
    height: 1,
    backgroundColor: colors.glassBorder,
    marginHorizontal: 16,
  },

  note: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 24,
  },

  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 12,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
  },

  skipBtn: { alignItems: "center", paddingVertical: 10 },
  skipText: { fontSize: 13, color: colors.textMuted, fontWeight: "500" },
});