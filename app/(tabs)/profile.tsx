import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/constants/Colors";
import { Fonts } from "@/constants/Fonts";

export default function ProfileScreen() {
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "achievements" | "reviews" | "settings"
  >("achievements");

  const trophies = useMemo(() => Array.from({ length: 9 }, (_, i) => i), []);

  const friendId = "1234-1234-1234-1234";
  const levelText = "Lv.100";
  const nameText = "Name";

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.friendLabel}>Tynadex ID</Text>
        <Text style={styles.friendId}>{friendId}</Text>
      </View>

      <View style={styles.avatarWrap}>
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={44} color="#ffffff" />
        </View>
      </View>

      <View style={styles.identity}>
        <Text style={styles.level}>{levelText}</Text>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{nameText}</Text>
          <Ionicons name="create" size={18} color="#111827" />
        </View>
      </View>

      <View style={styles.statsCard}>
        <Stat label="Cards" value="170" />
        <Stat label="Market Value" value="$2,000" />
        <Stat label="Paid" value="$4,000" />
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
            style={[
              styles.signOutButton,
              loading && styles.buttonDisabled,
            ]}
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
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 96, // keep content clear of the floating tab bar
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
  avatarPlaceholder: {
    width: 138,
    height: 138,
    borderRadius: 999,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
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
});
