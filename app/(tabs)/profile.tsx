import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/src/lib/supabase";
import { uploadProfileAvatar } from "@/src/lib/avatars";
import { type ProfileRow, saveProfileFields } from "@/src/lib/profileDb";
import { Colors } from "@/src/constants/Colors";
import { Fonts } from "@/src/constants/Fonts";

export default function ProfileScreen() {
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [activeSection, setActiveSection] = useState<
    "achievements" | "reviews" | "settings"
  >("achievements");

  const trophies = useMemo(() => Array.from({ length: 9 }, (_, i) => i), []);

  const levelText = "Lv.100";

  const displayName = profile?.display_name?.trim() || profile?.username || "Trainer";
  const tynadexId = profile?.username ?? "—";

  const loadProfile = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    setProfileLoading(false);

    if (error) {
      console.error(error);
      Alert.alert("Profile", "Could not load your profile. Check your connection.");
      return;
    }

    if (data) {
      setProfile(data as ProfileRow);
    } else {
      setProfile(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  async function handleSignOut() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          await supabase.auth.signOut();
          setLoading(false);
        },
      },
    ]);
  }

  function openNameEditor() {
    setDraftName(profile?.display_name ?? profile?.username ?? "");
    setNameModalVisible(true);
  }

  async function saveDisplayName() {
    const trimmed = draftName.trim();
    if (!trimmed) {
      Alert.alert("Name", "Please enter a name.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setSavingName(true);
    const { data, errorMessage } = await saveProfileFields(
      user,
      profile,
      { display_name: trimmed },
    );
    setSavingName(false);

    if (errorMessage) {
      Alert.alert(
        "Could not save",
        `${errorMessage}\n\nIf you use Supabase RLS, run migration 00003_profiles_insert_rls.sql so new profile rows can be created when needed.`,
      );
      return;
    }

    if (data) {
      setProfile(data);
    }
    setNameModalVisible(false);
  }

  async function pickAndUploadAvatar() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permission needed",
        "Allow photo library access to set your profile picture.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    setUploadingAvatar(true);

    const upload = await uploadProfileAvatar({
      userId: user.id,
      localUri: asset.uri,
      mimeType: asset.mimeType ?? undefined,
    });

    if ("error" in upload) {
      setUploadingAvatar(false);
      Alert.alert(
        "Upload failed",
        `${upload.error}\n\nIf this is your first time, create the "avatars" bucket and storage policies in Supabase (see supabase/migrations/00002_storage_avatars.sql).`,
      );
      return;
    }

    const { data, errorMessage } = await saveProfileFields(user, profile, {
      avatar_url: upload.publicUrl,
    });

    setUploadingAvatar(false);

    if (errorMessage) {
      Alert.alert(
        "Could not save avatar",
        `${errorMessage}\n\nPhoto uploaded to storage, but saving the URL failed. Check RLS / profiles insert policy (00003).`,
      );
      return;
    }

    if (data) {
      setProfile(data);
    }
  }

  if (profileLoading && !profile) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.friendLabel}>Tynadex ID</Text>
        <Text style={styles.friendId}>{tynadexId}</Text>
      </View>

      <Pressable
        style={styles.avatarWrap}
        onPress={pickAndUploadAvatar}
        disabled={uploadingAvatar || profileLoading}
      >
        {uploadingAvatar ? (
          <View style={[styles.avatarPlaceholder, styles.avatarBusy]}>
            <ActivityIndicator color="#ffffff" />
          </View>
        ) : profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={44} color="#ffffff" />
            <Text style={styles.avatarHint}>Tap to add photo</Text>
          </View>
        )}
      </Pressable>

      <View style={styles.identity}>
        <Text style={styles.level}>{levelText}</Text>
        <Pressable style={styles.nameRow} onPress={openNameEditor}>
          <Text style={styles.name}>{displayName}</Text>
          <Ionicons name="create" size={18} color="#111827" />
        </Pressable>
      </View>

      <View style={styles.statsCard}>
        <Stat label="Cards" value="0" />
        <Stat label="Market Value" value="$0" />
        <Stat label="Paid" value="$0" />
      </View>

      <View style={styles.pillsRow}>
        <Pill
          title="Achievements"
          active={activeSection === "achievements"}
          onPress={() => setActiveSection("achievements")}
        />
        <Pill
          title="Reviews"
          active={activeSection === "reviews"}
          onPress={() => setActiveSection("reviews")}
        />
        <Pill
          title="Settings"
          active={activeSection === "settings"}
          onPress={() => setActiveSection("settings")}
        />
      </View>

      {activeSection === "achievements" ? (
        <View style={styles.trophiesGrid}>
          {trophies.map((key) => (
            <View key={key} style={styles.trophyCell}>
              <Ionicons name="trophy" size={44} color="#AAB6FF" />
            </View>
          ))}
        </View>
      ) : null}

      {activeSection === "reviews" ? (
        <View style={styles.placeholderSection}>
          <Text style={styles.placeholderText}>Reviews will appear here.</Text>
        </View>
      ) : null}

      {activeSection === "settings" ? (
        <View style={styles.placeholderSection}>
          <Text style={styles.placeholderText}>Settings</Text>
          <Pressable
            style={[styles.signOutButton, loading && styles.buttonDisabled]}
            onPress={handleSignOut}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <Text style={styles.signOutText}>Sign Out</Text>
            )}
          </Pressable>
        </View>
      ) : null}

      <Modal
        visible={nameModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setNameModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Display name</Text>
            <TextInput
              value={draftName}
              onChangeText={setDraftName}
              placeholder="Your name"
              placeholderTextColor="#9CA3AF"
              style={styles.modalInput}
              autoFocus
              autoCapitalize="words"
              editable={!savingName}
            />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalButtonGhost}
                onPress={() => setNameModalVisible(false)}
                disabled={savingName}
              >
                <Text style={styles.modalButtonGhostText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButtonPrimary, savingName && styles.buttonDisabled]}
                onPress={() => void saveDisplayName()}
                disabled={savingName}
              >
                {savingName ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.modalButtonPrimaryText}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function Pill({
  title,
  active,
  onPress,
}: {
  title: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        active && styles.pillActive,
        pressed && { opacity: 0.95 },
      ]}
      disabled={!onPress}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 96,
  },

  top: {
    width: "100%",
    alignItems: "flex-end",
    marginBottom: 14,
  },
  friendLabel: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: "#6B7280",
    textAlign: "right",
  },
  friendId: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: "#111827",
    marginTop: 6,
    textAlign: "right",
  },

  avatarWrap: {
    width: 138,
    height: 138,
    borderRadius: 999,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
    backgroundColor: "#000000",
  },
  avatarImage: {
    width: 138,
    height: 138,
    borderRadius: 999,
  },
  avatarPlaceholder: {
    width: 138,
    height: 138,
    borderRadius: 999,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBusy: {
    justifyContent: "center",
  },
  avatarHint: {
    marginTop: 6,
    fontSize: 10,
    fontFamily: Fonts.regular,
    color: "#9CA3AF",
    textAlign: "center",
    paddingHorizontal: 8,
  },

  identity: {
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },
  level: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: "#6B7280",
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  name: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: "#111827",
  },

  statsCard: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: "#6B7280",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 12,
    fontFamily: Fonts.semibold,
    color: "#2563EB",
  },

  pillsRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  pill: {
    flex: 1,
    marginHorizontal: 4,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  pillActive: {
    backgroundColor: "#F3F4F6",
    borderColor: "#F3F4F6",
  },
  pillText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: "#6B7280",
  },
  pillTextActive: {
    color: "#111827",
  },

  trophiesGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  trophyCell: {
    width: "30%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    marginBottom: 18,
  },

  placeholderSection: {
    width: "100%",
    alignItems: "center",
    paddingBottom: 16,
  },
  placeholderText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: "#6B7280",
    marginBottom: 18,
    textAlign: "center",
  },
  signOutButton: {
    width: "100%",
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  signOutText: {
    color: Colors.primary,
    fontSize: 16,
    fontFamily: Fonts.semibold,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: "#111827",
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: "#111827",
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  modalButtonGhost: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  modalButtonGhostText: {
    fontFamily: Fonts.medium,
    color: "#6B7280",
    fontSize: 15,
  },
  modalButtonPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: 88,
    alignItems: "center",
  },
  modalButtonPrimaryText: {
    color: "#ffffff",
    fontFamily: Fonts.semibold,
    fontSize: 15,
  },
});
