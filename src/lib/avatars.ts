import { File } from "expo-file-system";
import { supabase } from "@/src/lib/supabase";

const BUCKET = "avatars";

function extFromMime(mime: string | undefined, uri: string): string {
  if (mime?.includes("png")) return "png";
  if (mime?.includes("webp")) return "webp";
  if (mime?.includes("jpeg") || mime?.includes("jpg")) return "jpg";
  const lower = uri.toLowerCase();
  if (lower.endsWith(".png")) return "png";
  if (lower.endsWith(".webp")) return "webp";
  return "jpg";
}

async function uriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
  // iOS/Android `file://` gallery URIs: `fetch().blob()` often fails or yields empty bodies.
  try {
    const file = new File(uri);
    return await file.arrayBuffer();
  } catch {
    const response = await fetch(uri);
    const blob = await response.blob();
    return await blob.arrayBuffer();
  }
}

/**
 * Upload a local image to Supabase Storage and return the public URL for `profiles.avatar_url`.
 */
export async function uploadProfileAvatar(params: {
  userId: string;
  localUri: string;
  mimeType: string | undefined;
}): Promise<{ publicUrl: string } | { error: string }> {
  const ext = extFromMime(params.mimeType, params.localUri);
  const objectPath = `${params.userId}/avatar.${ext}`;
  const contentType = params.mimeType ?? "image/jpeg";

  let body: ArrayBuffer;
  try {
    body = await uriToArrayBuffer(params.localUri);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { error: `Could not read image: ${message}` };
  }

  if (!body || body.byteLength === 0) {
    return { error: "Image file was empty. Try another photo or disable cropping." };
  }

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, body, { contentType, upsert: true });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  return { publicUrl: data.publicUrl };
}
