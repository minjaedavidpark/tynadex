import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "@/src/lib/supabase";
import { Fonts } from "@/src/constants/Fonts";
import {
  getUserBinders,
  createBinder,
  deleteBinder,
  type BinderWithCount,
} from "@/src/services/binder";

const COLORS = {
  background: "#FFFFFF",
  icon: "#111827",
  searchBg: "#F3F4F6",
  placeholder: "#9CA3AF",
  text: "#111827",
  textSecondary: "#6B7280",
  plusBg: "#F8F9FA",
  plusBorder: "#DEE2E6",
  plus: "#9CA3AF",
  overlay: "rgba(0,0,0,0.5)",
  white: "#FFFFFF",
  primary: "#E63946",
  shadow: "#000000",
} as const;

const BINDER_COLORS = [
  "#E63946",
  "#457B9D",
  "#2A9D8F",
  "#E9C46A",
  "#264653",
  "#F4A261",
  "#7B2D8E",
  "#1D3557",
] as const;

export default function BinderScreen() {
  const router = useRouter();
  const [binders, setBinders] = useState<BinderWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const loadBinders = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const data = await getUserBinders(user.id);
      setBinders(data);
    } catch (err) {
      console.error("Failed to load binders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBinders();
    }, [loadBinders])
  );

  const filtered = searchQuery.trim()
    ? binders.filter((b) =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : binders;

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await createBinder({
        user_id: user.id,
        name: newName.trim(),
        description: newDescription.trim() || undefined,
      });
      setModalVisible(false);
      setNewName("");
      setNewDescription("");
      await loadBinders();
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to create binder");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (binder: BinderWithCount) => {
    Alert.alert(
      "Delete Binder",
      `Delete "${binder.name}"? Cards inside won't be removed from your collection.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteBinder(binder.id);
              await loadBinders();
            } catch (err: any) {
              Alert.alert("Error", err.message ?? "Failed to delete");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.searchRow}>
        <Ionicons name="book" size={22} color={COLORS.primary} />
        <View style={styles.searchPill}>
          <Ionicons
            name="search"
            size={16}
            color={COLORS.placeholder}
            style={{ marginRight: 6 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search binders"
            placeholderTextColor={COLORS.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>My Binders</Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridContent}
      >
        <View style={styles.grid}>
          {filtered.map((binder, index) => {
            const color = BINDER_COLORS[index % BINDER_COLORS.length];
            return (
              <Pressable
                key={binder.id}
                style={({ pressed }) => [
                  styles.binderCard,
                  pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
                ]}
                onPress={() => router.push(`/binder/${binder.id}`)}
                onLongPress={() => handleDelete(binder)}
              >
                {binder.cover_image_url ? (
                  <Image
                    source={{ uri: binder.cover_image_url }}
                    style={styles.binderCover}
                  />
                ) : (
                  <View style={[styles.binderCover, { backgroundColor: color }]}>
                    <Ionicons
                      name="book"
                      size={36}
                      color="rgba(255,255,255,0.3)"
                    />
                  </View>
                )}
                <View style={styles.binderInfo}>
                  <Text style={styles.binderName} numberOfLines={1}>
                    {binder.name}
                  </Text>
                  <Text style={styles.binderCount}>
                    {binder.card_count} card
                    {binder.card_count !== 1 ? "s" : ""}
                  </Text>
                </View>
              </Pressable>
            );
          })}

          {/* New binder button */}
          <Pressable
            style={({ pressed }) => [
              styles.plusCard,
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={30} color={COLORS.plus} />
            <Text style={styles.plusText}>New Binder</Text>
          </Pressable>
        </View>

        {filtered.length === 0 && !searchQuery.trim() && (
          <View style={styles.emptyState}>
            <Ionicons
              name="book-outline"
              size={48}
              color={COLORS.placeholder}
            />
            <Text style={styles.emptyText}>No binders yet</Text>
            <Text style={styles.emptySubtext}>
              Tap + to create your first binder
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Create Binder Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Binder</Text>

            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Charizard Collection"
              placeholderTextColor={COLORS.placeholder}
              value={newName}
              onChangeText={setNewName}
              autoFocus
              maxLength={50}
            />

            <Text style={styles.inputLabel}>Description (optional)</Text>
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              placeholder="What's this binder for?"
              placeholderTextColor={COLORS.placeholder}
              value={newDescription}
              onChangeText={setNewDescription}
              multiline
              maxLength={200}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => {
                  setModalVisible(false);
                  setNewName("");
                  setNewDescription("");
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.createBtn,
                  (!newName.trim() || creating) && styles.btnDisabled,
                ]}
                onPress={handleCreate}
                disabled={!newName.trim() || creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.createText}>Create</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  /* ── Header / search ─────────────────── */
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  searchPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.searchBg,
    borderRadius: 999,
    paddingHorizontal: 14,
    height: 38,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: COLORS.text,
    paddingVertical: 0,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: COLORS.text,
    marginBottom: 14,
  },

  /* ── Grid ────────────────────────────── */
  gridContent: {
    paddingBottom: 32,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  binderCard: {
    width: "48%",
    borderRadius: 16,
    backgroundColor: COLORS.white,
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  binderCover: {
    width: "100%",
    aspectRatio: 4 / 3,
    alignItems: "center",
    justifyContent: "center",
  },
  binderInfo: {
    padding: 12,
  },
  binderName: {
    fontSize: 15,
    fontFamily: Fonts.semibold,
    color: COLORS.text,
  },
  binderCount: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  plusCard: {
    width: "48%",
    borderRadius: 16,
    backgroundColor: COLORS.plusBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.plusBorder,
    borderStyle: "dashed",
    marginBottom: 14,
    aspectRatio: 4 / 3,
  },
  plusText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: COLORS.plus,
    marginTop: 6,
  },

  /* ── Empty state ─────────────────────── */
  emptyState: {
    alignItems: "center",
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: COLORS.text,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  /* ── Modal ───────────────────────────── */
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: COLORS.text,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: COLORS.searchBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: COLORS.text,
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.searchBg,
  },
  cancelText: {
    fontSize: 15,
    fontFamily: Fonts.semibold,
    color: COLORS.text,
  },
  createBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  createText: {
    fontSize: 15,
    fontFamily: Fonts.semibold,
    color: COLORS.white,
  },
});
