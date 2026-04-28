import type { Store, StockStatus } from "@/types/store"

export function storeToStoresTableRow(s: Store): Record<string, unknown> {
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

export const STORES_SELECT_COLUMNS =
  "id,biz_reg_no,store_name,address,lat,lng,phone,bag_types,stock_status,updated_at"

type StoresRow = Record<string, unknown>

function isStockStatus(v: unknown): v is StockStatus {
  return v === "FULL" || v === "FEW" || v === "EMPTY"
}

export function dbRowToStore(row: unknown): Store | null {
  if (!row || typeof row !== "object") return null
  const r = row as StoresRow
  const lat = Number(r.lat)
  const lng = Number(r.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  const id = typeof r.id === "string" ? r.id : ""
  const storeName = typeof r.store_name === "string" ? r.store_name : ""
  if (!id || !storeName) return null

  const stockStatus: StockStatus = isStockStatus(r.stock_status)
    ? r.stock_status
    : "FULL"

  return {
    id,
    bizRegNo: typeof r.biz_reg_no === "string" ? r.biz_reg_no : "",
    storeName,
    address: typeof r.address === "string" ? r.address : "",
    lat,
    lng,
    phone: typeof r.phone === "string" ? r.phone : "",
    bagTypes: Array.isArray(r.bag_types)
      ? r.bag_types.filter((v): v is string => typeof v === "string")
      : [],
    stockStatus,
    updatedAt:
      typeof r.updated_at === "string"
        ? r.updated_at
        : new Date().toISOString(),
  }
}
