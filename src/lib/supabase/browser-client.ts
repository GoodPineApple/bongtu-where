"use client"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

function createBrowserClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!url || !anonKey) return null
  return createClient(url, anonKey)
}

/** 브라우저 전용 싱글톤. env 미설정 시 null */
export const supabase: SupabaseClient | null = createBrowserClient()
