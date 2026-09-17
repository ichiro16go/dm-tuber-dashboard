import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

let cachedClient: SupabaseClient | null = null;

/** 読み取り専用クライアント（anon key）。ダッシュボード表示用。 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (cachedClient) return cachedClient;

  cachedClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
  return cachedClient;
}

/** 書き込み用クライアント（service role key）。バッチ処理専用。ブラウザに露出しないこと。 */
export function getSupabaseAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY must be set to run the batch job."
    );
  }

  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}
