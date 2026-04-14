import { createClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * 환경 변수가 없으면 null. (로컬 JSON만 쓰는 경우 등)
 * @type {import("@supabase/supabase-js").SupabaseClient | null}
 */
export const supabase =
  typeof url === "string" &&
  url.length > 0 &&
  typeof anonKey === "string" &&
  anonKey.length > 0
    ? createClient(url, anonKey)
    : null
