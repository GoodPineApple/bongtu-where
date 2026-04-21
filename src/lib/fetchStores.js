import { dbRowToStore, STORES_SELECT_COLUMNS } from "@/lib/storeToDbRow.js"

const PAGE_SIZE = 1000

/**
 * Supabase `stores` 전체를 페이지네이션으로 가져와 앱 Store 배열로 반환.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns {Promise<import('../types/store.js').Store[]>}
 */
export async function fetchAllStores(supabase) {
  /** @type {import('../types/store.js').Store[]} */
  const stores = []
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
