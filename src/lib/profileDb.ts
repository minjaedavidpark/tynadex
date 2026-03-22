import type { User } from "@supabase/supabase-js";
import { supabase } from "@/src/lib/supabase";

export type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

function defaultUsername(user: User): string {
  return `u_${user.id.replace(/-/g, "").slice(0, 16)}`;
}

/**
 * Guarantees a profiles row exists for the given user.
 * Returns the existing row or creates a minimal one.
 */
export async function ensureProfile(user: User): Promise<ProfileRow | null> {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return existing as ProfileRow;

  const { data: created, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      username: defaultUsername(user),
      display_name:
        user.user_metadata?.display_name ??
        user.user_metadata?.username ??
        "Trainer",
    })
    .select("id, username, display_name, avatar_url")
    .maybeSingle();

  if (error) {
    console.error("ensureProfile insert failed:", error.message);
    return null;
  }

  return created as ProfileRow;
}

/**
 * Persists profile fields. Uses UPDATE first; if no row exists (0 matches), INSERTs.
 * Requires RLS policy "Users can insert own profile" — see `00003_profiles_insert_rls.sql`.
 */
export async function saveProfileFields(
  user: User,
  current: ProfileRow | null,
  patch: Partial<Pick<ProfileRow, "display_name" | "avatar_url">>,
): Promise<{ data: ProfileRow | null; errorMessage: string | null }> {
  const updatePayload = Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined),
  ) as Record<string, string | null>;

  if (Object.keys(updatePayload).length === 0) {
    return { data: current, errorMessage: null };
  }

  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", user.id)
    .select("id, username, display_name, avatar_url")
    .maybeSingle();

  if (updateError) {
    return { data: null, errorMessage: updateError.message };
  }

  if (updated) {
    return { data: updated as ProfileRow, errorMessage: null };
  }

  const insertPayload = {
    id: user.id,
    username: current?.username ?? defaultUsername(user),
    display_name:
      (patch.display_name !== undefined
        ? patch.display_name
        : current?.display_name) ?? null,
    avatar_url:
      (patch.avatar_url !== undefined ? patch.avatar_url : current?.avatar_url) ?? null,
  };

  const { data: inserted, error: insertError } = await supabase
    .from("profiles")
    .insert(insertPayload)
    .select("id, username, display_name, avatar_url")
    .maybeSingle();

  if (insertError) {
    return { data: null, errorMessage: insertError.message };
  }

  return { data: inserted as ProfileRow, errorMessage: null };
}
