import { supabase } from "@/src/lib/supabase";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export class TcgdexApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "TcgdexApiError";
    this.status = status;
    this.body = body;
  }
}

function assertEnv(): { url: string; anonKey: string } {
  if (!SUPABASE_URL || !ANON_KEY) {
    throw new Error(
      "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY for TCGdex API calls.",
    );
  }
  return { url: SUPABASE_URL, anonKey: ANON_KEY };
}

/**
 * GET an Edge Function with query params. Uses the user JWT when signed in,
 * otherwise the anon key (same pattern as Supabase client requests).
 */
export async function invokeTcgdexGet(
  functionName: string,
  query: Record<string, string | number | boolean | undefined>,
): Promise<unknown> {
  const { url: baseUrl, anonKey } = assertEnv();

  const url = new URL(`${baseUrl.replace(/\/$/, "")}/functions/v1/${functionName}`);
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "") continue;
    url.searchParams.set(key, String(value));
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? anonKey;

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new TcgdexApiError("Invalid JSON from Edge Function", res.status, text);
  }

  if (!res.ok) {
    const message =
      typeof json === "object" &&
      json !== null &&
      "error" in json &&
      typeof (json as { error: unknown }).error === "string"
        ? (json as { error: string }).error
        : res.statusText || `Request failed (${res.status})`;
    throw new TcgdexApiError(message, res.status, json);
  }

  return json;
}
