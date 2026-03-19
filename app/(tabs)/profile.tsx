import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/constants/Colors";

export default function ProfileScreen() {
  const [loading, setLoading] = useState(false);

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
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>Your profile, wishlist, and reviews.</Text>

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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 40,
  },
  signOutButton: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  signOutText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
});
