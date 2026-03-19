import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { supabase } from "@/lib/supabase";

export function getOAuthRedirectUri(): string {
  const isExpoGo = Constants.executionEnvironment === "storeClient";
  if (isExpoGo) {
    const experienceUrl = Constants.experienceUrl;
    if (experienceUrl) return experienceUrl;
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) return `exp://${hostUri}`;
  }
  return "tynadex://";
}

export async function signInWithGoogle() {
  const redirectTo = getOAuthRedirectUri();

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
