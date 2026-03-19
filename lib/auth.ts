import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";

// In Expo Go: exp://192.168.x.x:8081  (registered scheme — iOS can intercept it)
// In a standalone/dev build: tynadex://  (registered via app.json scheme)
export function getOAuthRedirectUri() {
  return Linking.createURL("/");
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
