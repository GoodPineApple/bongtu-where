import type { SupabaseClient } from "@supabase/supabase-js"
import { dbRowToStore, STORES_SELECT_COLUMNS } from "@/lib/data/store-to-db-row"
import type { Store } from "@/types/store"

const PAGE_SIZE = 1000

export async function fetchAllStores(supabase: SupabaseClient): Promise<Store[]> {
  const stores: Store[] = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from("stores")
      .select(STORES_SELECT_COLUMNS)
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw new Error(error.message || "stores 조회에 실패했습니다.")
    if (!data || data.length === 0) break

    for (const row of data) {
      const s = dbRowToStore(row)
      if (s) stores.push(s)
    }

    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }
  return stores
}
