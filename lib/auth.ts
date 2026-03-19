import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { Alert } from "react-native";
import { supabase } from "@/lib/supabase";

function getOAuthRedirectUri(): string {
  const isExpoGo = Constants.executionEnvironment === "storeClient";
  if (isExpoGo) {
    // experienceUrl gives the full exp://ip:port URL that Expo Go has registered
    const experienceUrl = Constants.experienceUrl;
    if (experienceUrl) return experienceUrl;
    // Fallback: build from hostUri
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) return `exp://${hostUri}`;
  }
  return "tynadex://";
}

export async function signInWithGoogle() {
  const redirectTo = getOAuthRedirectUri();

  // Temporary: show the redirect URI so we can verify it
  Alert.alert("Debug: Redirect URI", redirectTo);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) throw error ?? new Error("No OAuth URL returned");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type === "success" && result.url) {
    await supabase.auth.exchangeCodeForSession(result.url);
  }
}

export { getOAuthRedirectUri };
