import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/src/lib/supabase";
import { Fonts } from "@/src/constants/Fonts";
import {
  getBinder,
  getBinderCards,
  removeCardFromBinder,
  addTcgdexCardToBinder,
} from "@/src/services/binder";
import { searchCards, getCard } from "@/src/api/tcgdex/cards";
import type { Binder, BinderCardWithDetails } from "@/src/types/database";
import type { TcgdexCardSummary } from "@/src/api/tcgdex/types";

const COLORS = {
  background: "#FFFFFF",
  icon: "#111827",
  searchBg: "#F3F4F6",
  placeholder: "#9CA3AF",
  text: "#111827",
  textSecondary: "#6B7280",
  cardBorder: "#E5E7EB",
  imagePlaceholder: "#E5E7EB",
  white: "#FFFFFF",
  primary: "#E63946",
  overlay: "rgba(0,0,0,0.5)",
} as const;

const CARD_ASPECT_RATIO = 5 / 7;
const SCREEN_WIDTH = Dimensions.get("window").width;

const CONDITION_LABELS: Record<string, string> = {
  mint: "Mint",
  near_mint: "Near Mint",
  lightly_played: "Lightly Played",
  moderately_played: "Moderately Played",
  heavily_played: "Heavily Played",
  damaged: "Damaged",
};

const TRADE_LABELS: Record<string, string> = {
  none: "Not for trade",
  for_trade: "For Trade",
  for_sale: "For Sale",
  pending: "Pending",
};

export default function BinderDetailScreen() {
  const router = useRouter();
  const { binderId } = useLocalSearchParams<{ binderId: string }>();

  const [binder, setBinder] = useState<Binder | null>(null);
  const [cards, setCards] = useState<BinderCardWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Card detail modal
  const [selectedCard, setSelectedCard] = useState<BinderCardWithDetails | null>(null);
  const [showingBack, setShowingBack] = useState(false);

  // Add-card modal
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [tcgQuery, setTcgQuery] = useState("");
  const [tcgResults, setTcgResults] = useState<TcgdexCardSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingCard, setAddingCard] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadData = useCallback(async () => {
    if (!binderId) return;
    try {
      const [b, c] = await Promise.all([
        getBinder(binderId),
        getBinderCards(binderId),
      ]);
      setBinder(b);
      setCards(c);
    } catch (err) {
      console.error("Failed to load binder:", err);
    } finally {
      setLoading(false);
    }
  }, [binderId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = searchQuery.trim()
    ? cards.filter((bc) =>
        bc.user_card?.card?.name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    : cards;

  // ── TCGdex search with debounce ───────────────────────────

  const runTcgSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setTcgResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await searchCards(q);
      setTcgResults(results.slice(0, 30));
    } catch {
      setTcgResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const onTcgQueryChange = (text: string) => {
    setTcgQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => runTcgSearch(text), 500);
  };

  // ── Add card ──────────────────────────────────────────────

  const handleAdd = async (summary: TcgdexCardSummary) => {
    if (!binderId || !binder) return;
    setAddingCard(summary.id);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fullCard = await getCard(summary.id);
      await addTcgdexCardToBinder(
        user.id,
        binderId,
        fullCard,
        binder.grid_columns,
        binder.grid_rows
      );

      closeAddModal();
      await loadData();
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to add card");
    } finally {
      setAddingCard(null);
    }
  };

  const closeAddModal = () => {
    setAddModalVisible(false);
    setTcgQuery("");
    setTcgResults([]);
  };

  // ── Remove card ───────────────────────────────────────────

  const handleRemove = (bc: BinderCardWithDetails) => {
    const name = bc.user_card?.card?.name ?? "this card";
    Alert.alert("Remove Card", `Remove "${name}" from this binder?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await removeCardFromBinder(bc.id);
            await loadData();
          } catch (err: any) {
            Alert.alert("Error", err.message ?? "Failed to remove card");
          }
        },
      },
    ]);
  };

  // ── Render helpers ────────────────────────────────────────

  const getCardImageUri = (bc: BinderCardWithDetails) =>
    bc.user_card?.card?.image_url_hires ??
    bc.user_card?.card?.image_url ??
    bc.user_card?.front_image_url ??
    null;

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
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backBtn,
            pressed && { opacity: 0.85 },
          ]}
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.icon} />
        </Pressable>

        <Text style={styles.title} numberOfLines={1}>
          {binder?.name ?? "Binder"}
        </Text>

        <View style={styles.countPill}>
          <Ionicons
            name="albums"
            size={14}
            color={COLORS.textSecondary}
            style={{ marginRight: 4 }}
          />
          <Text style={styles.countText}>{cards.length}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchPill}>
          <Ionicons
            name="search"
            size={16}
            color={COLORS.placeholder}
            style={{ marginRight: 6 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search cards in binder"
            placeholderTextColor={COLORS.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Card grid */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columns}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="albums-outline"
              size={48}
              color={COLORS.placeholder}
            />
            <Text style={styles.emptyText}>No cards yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to add cards
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const uri = getCardImageUri(item);
          return (
            <Pressable
              style={styles.gridItem}
              onPress={() => { setSelectedCard(item); setShowingBack(false); }}
              onLongPress={() => handleRemove(item)}
            >
              <View style={styles.card}>
                {uri ? (
                  <Image
                    source={{ uri }}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={[
                      styles.cardImage,
                      { backgroundColor: COLORS.imagePlaceholder },
                    ]}
                  />
                )}
              </View>
              <Text style={styles.cardName} numberOfLines={1}>
                {item.user_card?.card?.name ?? "Unknown"}
              </Text>
              {item.user_card?.card?.rarity ? (
                <Text style={styles.cardMeta} numberOfLines={1}>
                  {item.user_card.card.rarity}
                </Text>
              ) : null}
            </Pressable>
          );
        }}
      />

      {/* FAB */}
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          pressed && { opacity: 0.9, transform: [{ scale: 0.95 }] },
        ]}
        onPress={() => setAddModalVisible(true)}
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
      </Pressable>

      {/* ── Card Detail Modal ──────────────────────────────── */}
      <Modal
        visible={!!selectedCard}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedCard(null)}
      >
        <Pressable
          style={styles.detailOverlay}
          onPress={() => setSelectedCard(null)}
        >
          <Pressable
            style={styles.detailSheet}
            onPress={(e) => e.stopPropagation()}
          >
            {selectedCard && (() => {
              const c = selectedCard.user_card?.card;
              const uc = selectedCard.user_card;
              const frontUri = getCardImageUri(selectedCard);
              const backUri = uc?.back_image_url ?? null;
              const displayUri = showingBack ? backUri : frontUri;

              return (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  {/* Card image */}
                  <View style={styles.detailImageWrap}>
                    {displayUri ? (
                      <Image
                        source={{ uri: displayUri }}
                        style={styles.detailImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <View
                        style={[
                          styles.detailImage,
                          { backgroundColor: COLORS.imagePlaceholder },
                        ]}
                      />
                    )}
                    {backUri && (
                      <Pressable
                        style={styles.flipBtn}
                        onPress={() => setShowingBack((p) => !p)}
                      >
                        <Ionicons
                          name="swap-horizontal"
                          size={18}
                          color={COLORS.white}
                        />
                        <Text style={styles.flipText}>
                          {showingBack ? "Front" : "Back"}
                        </Text>
                      </Pressable>
                    )}
                  </View>

                  {/* Info */}
                  <View style={styles.detailInfo}>
                    <Text style={styles.detailName}>
                      {c?.name ?? "Unknown Card"}
                    </Text>

                    {c?.card_number ? (
                      <Text style={styles.detailSub}>
                        #{c.card_number}
                      </Text>
                    ) : null}

                    {/* Type pills */}
                    <View style={styles.pillRow}>
                      {c?.supertype ? (
                        <View style={styles.pill}>
                          <Text style={styles.pillText}>{c.supertype}</Text>
                        </View>
                      ) : null}
                      {c?.types?.map((t) => (
                        <View
                          key={t}
                          style={[styles.pill, { backgroundColor: "#EEF2FF" }]}
                        >
                          <Text style={[styles.pillText, { color: "#4F46E5" }]}>
                            {t}
                          </Text>
                        </View>
                      ))}
                      {c?.rarity ? (
                        <View
                          style={[styles.pill, { backgroundColor: "#FEF3C7" }]}
                        >
                          <Text style={[styles.pillText, { color: "#B45309" }]}>
                            {c.rarity}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Detail rows */}
                    <View style={styles.detailGrid}>
                      {c?.hp ? (
                        <View style={styles.detailCell}>
                          <Text style={styles.detailLabel}>HP</Text>
                          <Text style={styles.detailValue}>{c.hp}</Text>
                        </View>
                      ) : null}

                      {uc?.condition ? (
                        <View style={styles.detailCell}>
                          <Text style={styles.detailLabel}>Condition</Text>
                          <Text style={styles.detailValue}>
                            {CONDITION_LABELS[uc.condition] ?? uc.condition}
                          </Text>
                        </View>
                      ) : null}

                      {uc?.quantity != null ? (
                        <View style={styles.detailCell}>
                          <Text style={styles.detailLabel}>Quantity</Text>
                          <Text style={styles.detailValue}>{uc.quantity}</Text>
                        </View>
                      ) : null}

                      {uc?.trade_status && uc.trade_status !== "none" ? (
                        <View style={styles.detailCell}>
                          <Text style={styles.detailLabel}>Trade</Text>
                          <Text style={styles.detailValue}>
                            {TRADE_LABELS[uc.trade_status] ?? uc.trade_status}
                          </Text>
                        </View>
                      ) : null}

                      {c?.market_price_usd != null ? (
                        <View style={styles.detailCell}>
                          <Text style={styles.detailLabel}>Market (USD)</Text>
                          <Text style={styles.detailValue}>
                            ${Number(c.market_price_usd).toFixed(2)}
                          </Text>
                        </View>
                      ) : null}

                      {c?.market_price_cad != null ? (
                        <View style={styles.detailCell}>
                          <Text style={styles.detailLabel}>Market (CAD)</Text>
                          <Text style={styles.detailValue}>
                            ${Number(c.market_price_cad).toFixed(2)}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {uc?.notes ? (
                      <View style={styles.notesBox}>
                        <Text style={styles.detailLabel}>Notes</Text>
                        <Text style={styles.notesText}>{uc.notes}</Text>
                      </View>
                    ) : null}

                    {/* Actions */}
                    <View style={styles.detailActions}>
                      <Pressable
                        style={styles.closeDetailBtn}
                        onPress={() => setSelectedCard(null)}
                      >
                        <Text style={styles.closeDetailText}>Close</Text>
                      </Pressable>
                      <Pressable
                        style={styles.removeDetailBtn}
                        onPress={() => {
                          setSelectedCard(null);
                          handleRemove(selectedCard);
                        }}
                      >
                        <Ionicons name="trash-outline" size={16} color={COLORS.white} />
                        <Text style={styles.removeDetailText}>Remove</Text>
                      </Pressable>
                    </View>
                  </View>
                </ScrollView>
              );
            })()}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Add Card Modal ────────────────────────────────── */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeAddModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalContent}>
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Card</Text>
              <Pressable onPress={closeAddModal} hitSlop={10}>
                <Ionicons name="close" size={24} color={COLORS.icon} />
              </Pressable>
            </View>

            {/* Search row */}
            <View style={styles.tcgSearchRow}>
              <View style={styles.searchPill}>
                <Ionicons
                  name="search"
                  size={16}
                  color={COLORS.placeholder}
                  style={{ marginRight: 6 }}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search Pokemon cards..."
                  placeholderTextColor={COLORS.placeholder}
                  value={tcgQuery}
                  onChangeText={onTcgQueryChange}
                  onSubmitEditing={() => runTcgSearch(tcgQuery)}
                  returnKeyType="search"
                  autoFocus
                />
              </View>
            </View>

            {/* Search results */}
            {searching && (
              <ActivityIndicator
                style={{ marginVertical: 24 }}
                color={COLORS.primary}
              />
            )}

            <FlatList
              data={tcgResults}
              keyExtractor={(item) => item.id}
              numColumns={3}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20, paddingTop: 4 }}
              columnWrapperStyle={styles.columns}
              ListEmptyComponent={
                tcgQuery.trim() && !searching ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptySubtext}>
                      No results found. Try a different name.
                    </Text>
                  </View>
                ) : !tcgQuery.trim() && !searching ? (
                  <View style={styles.emptyState}>
                    <Ionicons
                      name="search"
                      size={36}
                      color={COLORS.placeholder}
                    />
                    <Text style={styles.emptySubtext}>
                      Search for a Pokemon card to add
                    </Text>
                  </View>
                ) : null
              }
              renderItem={({ item }) => {
                const imgUri = item.image
                  ? `${item.image}/high.png`
                  : null;
                const isAdding = addingCard === item.id;
                return (
                  <Pressable
                    style={[styles.gridItem, isAdding && { opacity: 0.5 }]}
                    onPress={() => handleAdd(item)}
                    disabled={!!addingCard}
                  >
                    <View style={styles.card}>
                      {imgUri ? (
                        <Image
                          source={{ uri: imgUri }}
                          style={styles.cardImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={[
                            styles.cardImage,
                            { backgroundColor: COLORS.imagePlaceholder },
                          ]}
                        />
                      )}
                      {isAdding && (
                        <View style={styles.addingOverlay}>
                          <ActivityIndicator
                            size="small"
                            color={COLORS.white}
                          />
                        </View>
                      )}
                    </View>
                    <Text style={styles.cardName} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 14,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  /* Header */
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.searchBg,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: COLORS.text,
  },
  countPill: {
    flexDirection: "row",
    alignItems: "center",
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: COLORS.searchBg,
  },
  countText: {
    fontSize: 13,
    fontFamily: Fonts.semibold,
    color: COLORS.textSecondary,
  },

  /* Search */
  searchRow: {
    marginBottom: 10,
  },
  searchPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.searchBg,
    borderRadius: 999,
    paddingHorizontal: 14,
    height: 36,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: COLORS.text,
    paddingVertical: 0,
  },

  /* Card grid */
  listContent: {
    paddingBottom: 100,
    paddingTop: 4,
  },
  columns: {
    justifyContent: "space-between",
    marginBottom: 14,
  },
  gridItem: {
    width: "31%",
  },
  card: {
    width: "100%",
    aspectRatio: CARD_ASPECT_RATIO,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.white,
  },
  cardImage: {
    flex: 1,
  },
  cardName: {
    fontSize: 11,
    fontFamily: Fonts.semibold,
    color: COLORS.text,
    marginTop: 6,
  },
  cardMeta: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    color: COLORS.textSecondary,
    marginTop: 1,
  },

  /* Empty */
  emptyState: {
    alignItems: "center",
    paddingTop: 48,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: Fonts.semibold,
    color: COLORS.text,
  },
  emptySubtext: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  /* FAB */
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: COLORS.text,
  },
  tcgSearchRow: {
    marginBottom: 12,
  },
  addingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },

  /* Card detail modal */
  detailOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  detailSheet: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    width: "100%",
    maxHeight: "92%",
    overflow: "hidden",
  },
  detailImageWrap: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    paddingVertical: 16,
  },
  detailImage: {
    width: SCREEN_WIDTH * 0.55,
    height: SCREEN_WIDTH * 0.55 / CARD_ASPECT_RATIO,
    borderRadius: 12,
  },
  flipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  flipText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: COLORS.white,
  },
  detailInfo: {
    padding: 20,
  },
  detailName: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: COLORS.text,
  },
  detailSub: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: COLORS.searchBg,
  },
  pillText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: COLORS.text,
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 18,
    gap: 2,
  },
  detailCell: {
    width: "48%",
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  detailLabel: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 15,
    fontFamily: Fonts.semibold,
    color: COLORS.text,
    marginTop: 2,
  },
  notesBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.searchBg,
  },
  notesText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: COLORS.text,
    marginTop: 4,
  },
  detailActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  closeDetailBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.searchBg,
  },
  closeDetailText: {
    fontSize: 15,
    fontFamily: Fonts.semibold,
    color: COLORS.text,
  },
  removeDetailBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 46,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#DC3545",
  },
  removeDetailText: {
    fontSize: 15,
    fontFamily: Fonts.semibold,
    color: COLORS.white,
  },
});
