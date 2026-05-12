"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import {
  fetchStoresInBounds,
  type ViewportBounds,
} from "@/lib/data/fetch-stores-in-bounds"
import type { Store } from "@/types/store"

const DEBOUNCE_MS = 300
const PADDING_RATIO = 0.15
const MAX_RETAINED = 4000
const FETCH_LIMIT = 2000

export type ViewportStoresState = {
  stores: Store[]
  setStores: Dispatch<SetStateAction<Store[]>>
  loading: boolean
  error: string | null
  truncated: boolean
  /** 외부에서 마지막 bounds로 강제 재조회. */
  refetch: () => void
}

export type ViewportStoresOptions = {
  query: string
  bagFilter: string | null
}

/**
 * 지도 뷰포트가 바뀔 때마다 디바운스 + Supabase RPC 로 그 영역의 stores 만 가져와 병합.
 * - 호출은 외부에서 setBounds 로 트리거.
 * - 검색/봉투 필터를 같이 보내, 클라 재필터를 최소화.
 */
export function useViewportStores(
  client: SupabaseClient | null,
  options: ViewportStoresOptions,
): ViewportStoresState & {
  setBounds: (b: ViewportBounds) => void
} {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [truncated, setTruncated] = useState(false)

  const lastBoundsRef = useRef<ViewportBounds | null>(null)
  const lastRequestRef = useRef<string>("")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options

  const runFetch = useCallback(
    (bounds: ViewportBounds, mode: "merge" | "replace") => {
      if (!client) {
        setStores([])
        setError(
          "Supabase 환경 변수가 설정되지 않았습니다. .env 의 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 를 확인하세요.",
        )
        setLoading(false)
        return
      }

      abortRef.current?.abort()
      const ac = new AbortController()
      abortRef.current = ac

      const opts = optionsRef.current
      const requestKey = `${bounds.swLat}|${bounds.swLng}|${bounds.neLat}|${bounds.neLng}|${opts.query}|${opts.bagFilter ?? ""}`
      lastRequestRef.current = requestKey

      setLoading(true)
      setError(null)

      fetchStoresInBounds(client, bounds, {
        query: opts.query,
        bagType: opts.bagFilter,
        limit: FETCH_LIMIT,
        signal: ac.signal,
      })
        .then(({ stores: fresh, truncated: didTruncate }) => {
          if (ac.signal.aborted) return
          if (lastRequestRef.current !== requestKey) return
          setTruncated(didTruncate)
          setStores((prev) =>
            mode === "replace" ? fresh : mergeStores(prev, fresh),
          )
        })
        .catch((e: unknown) => {
          if (ac.signal.aborted) return
          if (e instanceof Error && e.name === "AbortError") return
          setError(
            e instanceof Error
              ? e.message
              : "판매소 데이터를 불러오지 못했습니다.",
          )
        })
        .finally(() => {
          if (!ac.signal.aborted && lastRequestRef.current === requestKey) {
            setLoading(false)
          }
        })
    },
    [client],
  )

  const setBounds = useCallback(
    (raw: ViewportBounds) => {
      const padded = padBounds(raw, PADDING_RATIO)
      lastBoundsRef.current = padded
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null
        runFetch(padded, "merge")
      }, DEBOUNCE_MS)
    },
    [runFetch],
  )

  const refetch = useCallback(() => {
    const b = lastBoundsRef.current
    if (b) runFetch(b, "merge")
  }, [runFetch])

  // 검색·필터가 바뀌면 누적된 prev 결과는 더 이상 의미 없으니 교체.
  useEffect(() => {
    if (lastBoundsRef.current) runFetch(lastBoundsRef.current, "replace")
  }, [options.query, options.bagFilter, runFetch])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      abortRef.current?.abort()
    }
  }, [])

  return {
    stores,
    setStores,
    loading,
    error,
    truncated,
    refetch,
    setBounds,
  }
}

function padBounds(b: ViewportBounds, ratio: number): ViewportBounds {
  const dLat = (b.neLat - b.swLat) * ratio
  const dLng = (b.neLng - b.swLng) * ratio
  return {
    swLat: b.swLat - dLat,
    swLng: b.swLng - dLng,
    neLat: b.neLat + dLat,
    neLng: b.neLng + dLng,
  }
}

/** 새 뷰포트 결과를 id 기준으로 병합. 메모리 상한 초과 시 최신(fresh) 항목 우선 보존. */
function mergeStores(prev: Store[], fresh: Store[]): Store[] {
  const freshIds = new Set(fresh.map((s) => s.id))
  const map = new Map<string, Store>()
  for (const s of prev) {
    if (!freshIds.has(s.id)) map.set(s.id, s)
  }
  for (const s of fresh) map.set(s.id, s)
  if (map.size <= MAX_RETAINED) return Array.from(map.values())

  const all = Array.from(map.values())
  return all.slice(all.length - MAX_RETAINED)
}
