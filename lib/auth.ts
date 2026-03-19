import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { supabase } from "@/lib/supabase";

// In Expo Go this returns exp://ip:port/--/
// In a standalone/dev build this returns tynadex://
export const oauthRedirectUri = makeRedirectUri();

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: oauthRedirectUri,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) throw error ?? new Error("No OAuth URL returned");

  const result = await WebBrowser.openAuthSessionAsync(
    data.url,
    oauthRedirectUri,
  );

  if (result.type === "success" && result.url) {
    await supabase.auth.exchangeCodeForSession(result.url);
  }
}
