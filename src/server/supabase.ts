import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/** service role 클라이언트. 서버에서만 사용한다. */
export function db(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export const EVIDENCE_BUCKET = "evidence";

export async function signedUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await db().storage.from(EVIDENCE_BUCKET).createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}
