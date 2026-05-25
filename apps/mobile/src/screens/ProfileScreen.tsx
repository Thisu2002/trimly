// D:\trimly\apps\mobile\src\screens\ProfileScreen.tsx
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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { auth0 } from "../lib/auth";
import { colors } from "../theme/colors";
import { AuthUser } from "../types/auth";
import { API_BASE_URL } from "../config/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  user: AuthUser | null;
  idToken: string | null;
  onLogout: () => void;
};

type ProfileData = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function AvatarCircle({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <LinearGradient
      colors={["rgba(42,79,122,0.9)", "rgba(0,59,143,0.7)"]}
      style={styles.avatarCircle}
    >
      <Text style={styles.avatarInitials}>{initials || "U"}</Text>
    </LinearGradient>
  );
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderIcon}>
          <Ionicons name={icon} size={15} color={colors.primaryLight} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function EditableField({
  label,
  value,
  onChangeText,
  editable,
  keyboardType = "default",
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  editable: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad";
  placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, !editable && styles.fieldInputDisabled]}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        keyboardType={keyboardType}
        placeholder={placeholder ?? `Enter ${label.toLowerCase()}`}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
      />
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={15} color={colors.textMuted} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>{value || "—"}</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen({ user, idToken, onLogout }: Props) {
  const insets = useSafeAreaInsets();
  const bottomPad = 62 + insets.bottom + 12;

  // Server-fetched profile
  const [profile, setProfile] = useState<ProfileData>({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(true);

  // Edit state (working copy)
  const [draft, setDraft] = useState<ProfileData>(profile);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Fetch full profile on mount ──────────────────────────────────────────
  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    if (!idToken) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      const fetched: ProfileData = {
        name: data.name ?? user?.name ?? "",
        email: data.email ?? user?.email ?? "",
        phone: data.phone ?? "",
        address: data.address ?? "",
      };
      setProfile(fetched);
      setDraft(fetched);
    } catch (err) {
      console.warn("[ProfileScreen] fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }

  // ── Save ─────────────────────────────────────────────────────────────────
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
        body: JSON.stringify({
          name: draft.name,
          phone: draft.phone,
          address: draft.address,
        }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const updated = await res.json();
      const saved: ProfileData = {
        name: updated.name ?? draft.name,
        email: updated.email ?? profile.email,
        phone: updated.phone ?? "",
        address: updated.address ?? "",
      };
      setProfile(saved);
      setDraft(saved);
      setEditing(false);
    } catch (err) {
      console.warn("[ProfileScreen] save failed:", err);
      Alert.alert("Save failed", "Could not update your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    setDraft(profile); // reset draft to last saved
    setEditing(false);
  }

  async function handleLogout() {
    try {
      await auth0.webAuth.clearSession();
      onLogout();
    } catch {
      Alert.alert("Logout failed", "Could not log out properly.");
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

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
            {/* ── Header ── */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Profile</Text>
              {!editing ? (
                <Pressable style={styles.editBtn} onPress={() => setEditing(true)}>
                  <Ionicons name="pencil-outline" size={15} color={colors.primaryLight} />
                  <Text style={styles.editBtnText}>Edit</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.cancelBtn} onPress={handleCancelEdit}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
              )}
            </View>

            {loading ? (
              <View style={styles.loadingBlock}>
                <ActivityIndicator size="large" color={colors.primaryLight} />
              </View>
            ) : (
              <>
                {/* ── Avatar + name block ── */}
                <View style={styles.avatarBlock}>
                  <AvatarCircle name={profile.name || "U"} />
                  <Text style={styles.displayName}>{profile.name || "—"}</Text>
                  <Text style={styles.displayEmail}>{profile.email}</Text>
                </View>

                {/* ── Personal Info ── */}
                <SectionCard title="Personal Info" icon="person-outline">
                  <EditableField
                    label="Name"
                    value={draft.name}
                    onChangeText={(v) => setDraft((d) => ({ ...d, name: v }))}
                    editable={editing}
                    placeholder="Your full name"
                  />
                  <EditableField
                    label="Phone"
                    value={draft.phone}
                    onChangeText={(v) => setDraft((d) => ({ ...d, phone: v }))}
                    editable={editing}
                    keyboardType="phone-pad"
                    placeholder="Your phone number"
                  />
                  <EditableField
                    label="Address"
                    value={draft.address}
                    onChangeText={(v) => setDraft((d) => ({ ...d, address: v }))}
                    editable={editing}
                    placeholder="Your address"
                  />
                </SectionCard>

                {/* ── Account Info (read-only) ── */}
                <SectionCard title="Account" icon="shield-checkmark-outline">
                  <InfoRow icon="mail-outline" label="Email" value={profile.email} />
                  <InfoRow icon="finger-print-outline" label="User ID" value={user?.sub ?? "—"} />
                </SectionCard>

                {/* ── Save button ── */}
                {editing && (
                  <Pressable
                    style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={17} color={colors.white} />
                        <Text style={styles.saveBtnText}>Save Changes</Text>
                      </>
                    )}
                  </Pressable>
                )}

                {/* ── Logout ── */}
                <Pressable style={styles.logoutBtn} onPress={handleLogout}>
                  <Ionicons name="log-out-outline" size={18} color="#FF6B6B" />
                  <Text style={styles.logoutText}>Log Out</Text>
                </Pressable>
              </>
            )}

            <View style={{ height: bottomPad }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 12 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: 0.3,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(42,79,122,0.5)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  editBtnText: { fontSize: 13, fontWeight: "600", color: colors.primaryLight },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  cancelBtnText: { fontSize: 13, fontWeight: "600", color: colors.textMuted },

  loadingBlock: { paddingTop: 80, alignItems: "center" },

  avatarBlock: { alignItems: "center", paddingVertical: 28, gap: 8 },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
    marginBottom: 4,
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: 1,
  },
  displayName: { fontSize: 20, fontWeight: "700", color: colors.text },
  displayEmail: { fontSize: 13, color: colors.textMuted },

  card: {
    backgroundColor: "rgba(20,28,45,0.6)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 16,
    marginBottom: 14,
    gap: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  cardHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(171,213,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },

  field: { gap: 5 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  fieldInput: {
    backgroundColor: "rgba(171,213,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(171,213,255,0.15)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.text,
  },
  fieldInputDisabled: {
    backgroundColor: "transparent",
    borderColor: "rgba(171,213,255,0.06)",
    color: colors.textSoft,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 2,
  },
  infoLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  infoValue: { fontSize: 13, color: colors.textSoft },

  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
    marginBottom: 14,
  },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: colors.white },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,107,107,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,107,107,0.2)",
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 4,
  },
  logoutText: { fontSize: 14, fontWeight: "700", color: "#FF6B6B" },
});