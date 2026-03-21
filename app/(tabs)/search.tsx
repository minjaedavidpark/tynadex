import { Ionicons } from "@expo/vector-icons";
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
  avatarBg: "#E5E7EB",
  primary: "#2563EB",
} as const;

/** Trading-card style placeholder: width : height = 5 : 7 */
const CARD_ASPECT_RATIO = 5 / 7;

export default function SearchScreen() {
  const router = useRouter();

  const cards = [
    { key: "greninja", title: "Greninja", user: "Cristiano", level: "Lv.100" },
    { key: "togekiss", title: "Togekiss", user: "Ethan", level: "Lv.120" },
    { key: "snorlax", title: "Snorlax", user: "David", level: "Lv.99" },
    { key: "puff", title: "Puff", user: "Romy", level: "Lv.1" },
    { key: "placeholder-5", title: "Card", user: "User", level: "Lv.10" },
    { key: "placeholder-6", title: "Card", user: "User", level: "Lv.42" },
  ] as const;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchRow}>
        <Ionicons name="location" size={22} color={COLORS.icon} />

        <View style={styles.searchPill}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor={COLORS.placeholder}
          />
        </View>

        <Ionicons name="filter-outline" size={22} color={COLORS.icon} />
      </View>

      <FlatList
        data={cards}
        keyExtractor={(item) => item.key}
        numColumns={2}
        columnWrapperStyle={styles.columns}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Pressable
              style={({ pressed }) => [
                styles.card,
                pressed && { opacity: 0.92 },
              ]}
              onPress={() => router.push(`/binder/${item.key}`)}
            >
              <View style={styles.cardImage} />
              <Text style={styles.cardTitle}>{item.title}</Text>
            </Pressable>

            <View style={styles.userRow}>
              <View style={styles.avatar} />
              <View style={styles.userText}>
                <Text style={styles.userName}>{item.user}</Text>
                <Text style={styles.userLevel}>{item.level}</Text>
              </View>
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
  listContent: {
    paddingBottom: 18,
  },
  columns: {
    justifyContent: "space-between",
  },
  item: {
    width: "48%",
    marginBottom: 18,
  },
  card: {
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
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingHorizontal: 2,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: COLORS.avatarBg,
    marginRight: 10,
  },
  userText: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontFamily: Fonts.semibold,
    color: COLORS.text,
  },
  userLevel: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: COLORS.primary,
    marginTop: 2,
  },
});
