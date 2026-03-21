import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { supabase } from "@/src/lib/supabase";
import { Fonts } from "@/src/constants/Fonts";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      Alert.alert("Sign In Failed", error.message);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.top}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>sign in to access your account</Text>
          </View>

          <View style={styles.form}>
            <View style={[styles.field]}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your email"
                placeholderTextColor={COLORS.placeholder}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
              <Ionicons name="mail-outline" size={20} color={COLORS.icon} />
            </View>

            <View style={[styles.field, styles.fieldSpacing]}>
              <TextInput
                style={styles.textInput}
                placeholder="Password"
                placeholderTextColor={COLORS.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="current-password"
              />
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.icon} />
            </View>

            <View style={styles.rememberRow}>
              <Pressable
                style={styles.rememberLeft}
                onPress={() => setRememberMe((v) => !v)}
              >
                <View
                  style={[
                    styles.checkbox,
                    rememberMe && styles.checkboxChecked,
                  ]}
                >
                  {rememberMe ? (
                    <Ionicons name="checkmark" size={14} color={COLORS.white} />
                  ) : null}
                </View>
                <Text style={styles.rememberLabel}>Remember me</Text>
              </Pressable>

              <Pressable
                onPress={() => Alert.alert("Forgot password", "Not implemented yet.")}
              >
                <Text style={styles.forgetLink}>Forget password ?</Text>
              </Pressable>
            </View>

            <Pressable
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={loading}
            >
              <View style={styles.primaryButtonInner}>
                <Text style={styles.primaryButtonText}>Next</Text>
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Ionicons name="chevron-forward" size={18} color={COLORS.white} />
                )}
              </View>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>New Member?</Text>
            <Link href="/(auth)/sign-up" asChild>
              <Pressable>
                <Text style={styles.footerLink}>Register now</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const COLORS = {
  white: "#FFFFFF",
  text: "#111827",
  subtitle: "#6B7280",
  placeholder: "#9CA3AF",
  icon: "#9CA3AF",
  inputBg: "#F3F4F6",
  primary: "#5B8EF6",
  checkboxBorder: "#C9D2E0",
} as const;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  form: {
    width: "100%",
    marginTop: 26,
  },
  safe: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 28,
    justifyContent: "space-between",
  },
  top: {
    alignItems: "center",
  },
  title: {
    fontSize: 30,
    fontFamily: Fonts.bold,
    color: COLORS.text,
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: COLORS.subtitle,
    textAlign: "center",
  },
  field: {
    width: "100%",
    height: 52,
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  fieldSpacing: {
    marginTop: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: COLORS.text,
    paddingVertical: 0,
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    marginBottom: 18,
  },
  rememberLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: COLORS.checkboxBorder,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  rememberLabel: {
    marginLeft: 10,
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: COLORS.subtitle,
  },
  forgetLink: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: COLORS.primary,
    textDecorationLine: "underline",
  },
  primaryButton: {
    width: "100%",
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 28,
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  primaryButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 8,
  },
  footerText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: COLORS.subtitle,
  },
  footerLink: {
    marginLeft: 6,
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: COLORS.primary,
    textDecorationLine: "underline",
  },
});
