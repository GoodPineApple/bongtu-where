/**
 * @param {import('../types/store.js').Store} s
 * @returns {Record<string, unknown>}
 */
export function storeToStoresTableRow(s) {
  return {
    id: s.id,
    biz_reg_no: s.bizRegNo,
    store_name: s.storeName,
    address: s.address,
    lat: s.lat,
    lng: s.lng,
    phone: s.phone,
    bag_types: s.bagTypes,
    stock_status: s.stockStatus,
    updated_at: s.updatedAt,
  }
}

/** Supabase `stores` 테이블에서 select 한 행 (snake_case) → 앱 내부 Store. */
export const STORES_SELECT_COLUMNS =
  "id,biz_reg_no,store_name,address,lat,lng,phone,bag_types,stock_status,updated_at"

/**
 * @param {Record<string, unknown>} row
 * @returns {import('../types/store.js').Store | null}
 */
export function dbRowToStore(row) {
  if (!row || typeof row !== "object") return null
  const lat = Number(row.lat)
  const lng = Number(row.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  const id = typeof row.id === "string" ? row.id : ""
  const storeName = typeof row.store_name === "string" ? row.store_name : ""
  if (!id || !storeName) return null

  const stockStatus = ["FULL", "FEW", "EMPTY"].includes(row.stock_status)
    ? row.stock_status
    : "FULL"

  return {
    id,
    bizRegNo: typeof row.biz_reg_no === "string" ? row.biz_reg_no : "",
    storeName,
    address: typeof row.address === "string" ? row.address : "",
    lat,
    lng,
    phone: typeof row.phone === "string" ? row.phone : "",
    bagTypes: Array.isArray(row.bag_types)
      ? row.bag_types.filter((v) => typeof v === "string")
      : [],
    stockStatus,
    updatedAt:
      typeof row.updated_at === "string"
        ? row.updated_at
        : new Date().toISOString(),
  }
}
