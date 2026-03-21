import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fonts } from "@/src/constants/Fonts";

const COLORS = {
  background: "#FFFFFF",
  icon: "#111827",
  searchBg: "#F3F4F6",
  placeholder: "#9CA3AF",
  text: "#111827",
  cardBorder: "#E5E7EB",
  imagePlaceholder: "#D1D5DB",
  subtle: "#6B7280",
  price: "#111827",
} as const;

/** Trading-card style placeholder: width : height = 5 : 7 */
const CARD_ASPECT_RATIO = 5 / 7;

type BinderCard = {
  id: string;
  qty: number;
  priceCad: number;
};

export default function BinderDetailScreen() {
  const router = useRouter();
  const { binderId } = useLocalSearchParams<{ binderId: string }>();

  const cards: BinderCard[] = Array.from({ length: 18 }, (_, i) => ({
    id: `${binderId ?? "binder"}-card-${i + 1}`,
    qty: i % 3 === 0 ? 2 : 1,
    priceCad: i % 3 === 1 ? 70.22 : 159.26,
  }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.85 }]}
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.icon} />
        </Pressable>

        <View style={styles.searchPill}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for cards"
            placeholderTextColor={COLORS.placeholder}
          />
        </View>

        <View style={styles.metaPill}>
          <Text style={styles.metaText}>2,221</Text>
        </View>

        <Pressable style={styles.viewPill}>
          <Text style={styles.viewText}>View</Text>
        </Pressable>

        <Ionicons name="filter-outline" size={22} color={COLORS.icon} />
      </View>

      <FlatList
        data={cards}
        keyExtractor={(item) => item.id}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columns}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Pressable style={styles.card}>
              <View style={styles.cardImage} />
            </Pressable>

            <View style={styles.metaRow}>
              <Text style={styles.qtyText}>Qty:{item.qty}</Text>
              <Text style={styles.priceText}>${item.priceCad.toFixed(2)} CAD</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.searchBg,
  },
  searchPill: {
    flex: 1,
    backgroundColor: COLORS.searchBg,
    borderRadius: 999,
    paddingHorizontal: 14,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  searchInput: {
    width: "100%",
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: COLORS.text,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  metaPill: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: COLORS.searchBg,
    alignItems: "center",
    justifyContent: "center",
  },
  metaText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: COLORS.text,
  },
  viewPill: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: COLORS.searchBg,
    alignItems: "center",
    justifyContent: "center",
  },
  viewText: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: COLORS.text,
  },
  listContent: {
    paddingBottom: 18,
    paddingTop: 6,
  },
  columns: {
    justifyContent: "space-between",
    marginBottom: 14,
  },
  item: {
    width: "31.5%",
  },
  card: {
    width: "100%",
    aspectRatio: CARD_ASPECT_RATIO,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    backgroundColor: "#fff",
  },
  cardImage: {
    flex: 1,
    backgroundColor: COLORS.imagePlaceholder,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  qtyText: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: COLORS.subtle,
  },
  priceText: {
    fontSize: 11,
    fontFamily: Fonts.semibold,
    color: COLORS.price,
  },
});

