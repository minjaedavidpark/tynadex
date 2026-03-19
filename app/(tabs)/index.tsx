import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fonts } from "@/constants/Fonts";
import { useRouter } from "expo-router";

const COLORS = {
  background: "#FFFFFF",
  icon: "#111827",
  searchBg: "#F3F4F6",
  placeholder: "#9CA3AF",
  text: "#111827",
  cardBg: "#FFFFFF",
  imagePlaceholder: "#D1D5DB",
  title: "#FFFFFF",
  plusBg: "#F3F4F6",
  plusBorder: "#E5E7EB",
  plus: "#9CA3AF",
} as const;

/** Trading-card style placeholder: width : height = 5 : 7 */
const CARD_ASPECT_RATIO = 5 / 7;

export default function BinderScreen() {
  const router = useRouter();

  const cards = [
    { key: "greninja", title: "Greninja" },
    { key: "charizard", title: "Charizard" },
    { key: "mewtwo", title: "Mew Two" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchRow}>
        <Ionicons name="camera-outline" size={22} color={COLORS.icon} />

        <View style={styles.searchPill}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor={COLORS.placeholder}
          />
        </View>

        <Ionicons name="filter-outline" size={22} color={COLORS.icon} />
      </View>

      <View style={styles.grid}>
        {cards.map((card) => (
          <Pressable
            key={card.key}
            style={({ pressed }) => [
              styles.card,
              pressed && { opacity: 0.9 },
            ]}
            onPress={() => router.push(`/binder/${card.key}`)}
          >
            <View style={styles.cardImage} />
            <Text style={styles.cardTitle}>{card.title}</Text>
          </Pressable>
        ))}

        <Pressable
          style={({ pressed }) => [
            styles.plusCard,
            pressed && { opacity: 0.9 },
          ]}
        >
          <Ionicons name="add" size={26} color={COLORS.plus} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  searchPill: {
    flex: 1,
    marginHorizontal: 12,
    backgroundColor: COLORS.searchBg,
    borderRadius: 999,
    paddingHorizontal: 14,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  searchInput: {
    width: "100%",
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: COLORS.text,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 6,
  },
  card: {
    width: "48%",
    aspectRatio: CARD_ASPECT_RATIO,
    borderRadius: 18,
    backgroundColor: COLORS.cardBg,
    overflow: "hidden",
  },
  cardImage: {
    flex: 1,
    backgroundColor: COLORS.imagePlaceholder,
  },
  cardTitle: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: COLORS.title,
  },
  plusCard: {
    width: "48%",
    aspectRatio: CARD_ASPECT_RATIO,
    borderRadius: 18,
    backgroundColor: COLORS.plusBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.plusBorder,
  },
});
