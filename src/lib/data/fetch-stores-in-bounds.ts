import type { SupabaseClient } from "@supabase/supabase-js"
import { dbRowToStore, STORES_SELECT_COLUMNS } from "@/lib/data/store-to-db-row"
import type { Store } from "@/types/store"

/** 지도 SW/NE 좌표 사각형. */
export type ViewportBounds = {
  swLat: number
  swLng: number
  neLat: number
  neLng: number
}

export type FetchStoresInBoundsOptions = {
  /** 검색어 (store_name / address ILIKE). */
  query?: string
  /** 봉투 종류 단일 필터. */
  bagType?: string | null
  /** 응답 행 상한. RPC 쪽 상한(5000)을 넘으면 잘림. */
  limit?: number
  /** AbortController 신호. */
  signal?: AbortSignal
}

export type FetchStoresInBoundsResult = {
  stores: Store[]
  /** 상한에 닿아 잘렸을 가능성. */
  truncated: boolean
}

const DEFAULT_LIMIT = 2000

type RpcLikeError = {
  code?: string
  message?: string
  status?: number
}

/** RPC 미배포·스키마 캐시 미반영 등으로 RPC 를 찾지 못한 경우 PostgREST 폴백으로 이어감. */
function isMissingStoresInBoundsRpc(err: RpcLikeError | null): boolean {
  if (!err) return false
  if (err.code === "PGRST202") return true
  if (err.status === 404) return true
  const m = (err.message ?? "").toLowerCase()
  return (
    m.includes("could not find the function") ||
    (m.includes("schema cache") && m.includes("function"))
  )
}

function isMissingBagTypesRpc(err: RpcLikeError | null): boolean {
  return isMissingStoresInBoundsRpc(err)
}

function normalizeBounds(b: ViewportBounds) {
  const minLat = Math.min(b.swLat, b.neLat)
  const maxLat = Math.max(b.swLat, b.neLat)
  const minLng = Math.min(b.swLng, b.neLng)
  const maxLng = Math.max(b.swLng, b.neLng)
  return { minLat, maxLat, minLng, maxLng }
}

/** PostgREST 필터 문자열 안에서 `,` 가 OR 구분자로 깨지지 않도록 이스케이프. */
function escapeOrFilterValue(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/,/g, "\\,")
}

/** ILIKE 패턴 안에서 `%` `_` 가 와일드카드로 동작하지 않도록 이스케이프. */
function escapeIlikePattern(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_")
}

/**
 * RPC 없이 `stores` 테이블만으로 bbox(+선택 검색·봉투) 조회.
 * 인덱스가 없으면 느릴 수 있으나, 마이그레이션 SQL 미적용 시에도 동작하게 한다.
 */
async function fetchStoresInBoundsViaRest(
  supabase: SupabaseClient,
  bounds: ViewportBounds,
  options: FetchStoresInBoundsOptions,
  limit: number,
): Promise<FetchStoresInBoundsResult> {
  const { minLat, maxLat, minLng, maxLng } = normalizeBounds(bounds)
  const qText = options.query?.trim() ?? ""
  const bag = options.bagType ?? null

  let q = supabase
    .from("stores")
    .select(STORES_SELECT_COLUMNS)
    .gte("lat", minLat)
    .lte("lat", maxLat)
    .gte("lng", minLng)
    .lte("lng", maxLng)
    .order("id", { ascending: true })
    .limit(limit)

  if (bag) q = q.contains("bag_types", [bag])

  if (qText) {
    const p = escapeOrFilterValue(escapeIlikePattern(qText))
    q = q.or(`store_name.ilike.%${p}%,address.ilike.%${p}%`)
  }

  if (options.signal) q = q.abortSignal(options.signal)

  const { data, error } = await q
  if (error) throw new Error(error.message || "stores 조회에 실패했습니다.")

  const rows = Array.isArray(data) ? data : []
  const stores: Store[] = []
  for (const row of rows) {
    const s = dbRowToStore(row)
    if (s) stores.push(s)
  }
  return { stores, truncated: rows.length >= limit }
}

/**
 * `stores_in_bounds` RPC 호출 → 앱 Store[] 변환.
 * RLS 는 호출자(anon) 컨텍스트로 적용됨.
 * RPC 가 없으면 동일 조건으로 `stores` 직접 조회로 폴백.
 */
export async function fetchStoresInBounds(
  supabase: SupabaseClient,
  bounds: ViewportBounds,
  options: FetchStoresInBoundsOptions = {},
): Promise<FetchStoresInBoundsResult> {
  const limit = options.limit ?? DEFAULT_LIMIT

  let req = supabase.rpc("stores_in_bounds", {
    sw_lat: bounds.swLat,
    sw_lng: bounds.swLng,
    ne_lat: bounds.neLat,
    ne_lng: bounds.neLng,
    p_query: options.query?.trim() ?? "",
    p_bag_type: options.bagType ?? null,
    p_limit: limit,
  })

  if (options.signal) {
    req = req.abortSignal(options.signal)
  }

  const { data, error } = await req
  if (!error) {
    const rows = Array.isArray(data) ? data : []
    const stores: Store[] = []
    for (const row of rows) {
      const s = dbRowToStore(row)
      if (s) stores.push(s)
    }
    return { stores, truncated: rows.length >= limit }
  }

  if (isMissingStoresInBoundsRpc(error))
    return fetchStoresInBoundsViaRest(supabase, bounds, options, limit)

  throw new Error(error.message || "stores 조회에 실패했습니다.")
}

const BAG_TYPES_PAGE = 1000

async function fetchAllBagTypesViaRest(
  supabase: SupabaseClient,
  signal?: AbortSignal,
): Promise<string[]> {
  const set = new Set<string>()
  let from = 0
  for (;;) {
    let q = supabase
      .from("stores")
      .select("bag_types")
      .order("id", { ascending: true })
      .range(from, from + BAG_TYPES_PAGE - 1)
    if (signal) q = q.abortSignal(signal)
    const { data, error } = await q
    if (error) throw new Error(error.message || "봉투 종류 조회에 실패했습니다.")
    const rows = Array.isArray(data) ? data : []
    if (rows.length === 0) break
    for (const row of rows) {
      const bt = (row as { bag_types?: unknown }).bag_types
      if (!Array.isArray(bt)) continue
      for (const t of bt) {
        if (typeof t === "string" && t.trim() !== "") set.add(t)
      }
    }
    if (rows.length < BAG_TYPES_PAGE) break
    from += BAG_TYPES_PAGE
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "ko"))
}

/**
 * `stores_bag_types` RPC → 칩에 쓰는 전체 distinct 목록.
 * 한 번 호출 후 캐시해 두고 쓰는 용도.
 * RPC 가 없으면 `bag_types` 컬럼만 페이지네이션해 distinct 를 만든다(느릴 수 있음).
 */
export async function fetchAllBagTypes(
  supabase: SupabaseClient,
  signal?: AbortSignal,
): Promise<string[]> {
  let req = supabase.rpc("stores_bag_types")
  if (signal) req = req.abortSignal(signal)
  const { data, error } = await req
  if (!error) {
    if (!Array.isArray(data)) return []
    const out: string[] = []
    for (const row of data) {
      const v = (row as { bag_type?: unknown })?.bag_type
      if (typeof v === "string" && v.trim() !== "") out.push(v)
    }
    return out.sort((a, b) => a.localeCompare(b, "ko"))
  }

  if (isMissingBagTypesRpc(error)) return fetchAllBagTypesViaRest(supabase, signal)

  throw new Error(error.message || "봉투 종류 조회에 실패했습니다.")
}
