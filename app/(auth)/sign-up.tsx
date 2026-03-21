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

export default function SignUpScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!fullName || !email || !phone || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }

    if (!termsAccepted) {
      Alert.alert("Error", "Please accept the Terms and Conditions.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: "togedex://sign-in",
        data: {
          full_name: fullName,
          display_name: fullName,
          phone,
        },
      },
    });
    setLoading(false);

    if (error) {
      Alert.alert("Sign Up Failed", error.message);
    } else if (data.session) {
      // Email confirmation is disabled — signed in immediately
    } else {
      Alert.alert(
        "Check your email",
        "We sent you a confirmation link. Tap it on this device to open the app.",
      );
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
            <Text style={styles.title}>Get Started</Text>
            <Text style={styles.subtitle}>by creating a free account.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <TextInput
                style={styles.textInput}
                placeholder="Full name"
                placeholderTextColor={COLORS.placeholder}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoComplete="name"
              />
              <Ionicons name="person-outline" size={20} color={COLORS.icon} />
            </View>

            <View style={[styles.field, styles.fieldSpacing]}>
              <TextInput
                style={styles.textInput}
                placeholder="Valid email"
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
                placeholder="Phone number"
                placeholderTextColor={COLORS.placeholder}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoComplete="tel"
              />
              <Ionicons name="call-outline" size={20} color={COLORS.icon} />
            </View>

            <View style={[styles.field, styles.fieldSpacing]}>
              <TextInput
                style={styles.textInput}
                placeholder="Strong Password"
                placeholderTextColor={COLORS.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="new-password"
              />
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.icon} />
            </View>

            <Pressable
              onPress={() => setTermsAccepted((v) => !v)}
              style={styles.termsRow}
            >
              <View
                style={[
                  styles.checkbox,
                  termsAccepted && styles.checkboxChecked,
                ]}
              >
                {termsAccepted ? (
                  <Ionicons name="checkmark" size={14} color={COLORS.white} />
                ) : null}
              </View>

              <Text style={styles.termsText}>
                By checking the box you agree to our{" "}
                <Text style={styles.termsLink}>Terms and Conditions</Text>.
              </Text>
            </Pressable>

            <Pressable
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleSignUp}
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
            <Text style={styles.footerText}>Already a member?</Text>
            <Link href="/(auth)/sign-in" asChild>
              <Pressable>
                <Text style={styles.footerLink}>Log In</Text>
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
  form: {
    width: "100%",
    marginTop: 22,
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
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 14,
    marginBottom: 18,
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
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  termsText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: COLORS.subtitle,
    lineHeight: 18,
  },
  termsLink: {
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
