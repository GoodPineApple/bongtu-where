"use client"

import { useEffect, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { fetchAllBagTypes } from "@/lib/data/fetch-stores-in-bounds"

export type BagTypesState = {
  bagOptions: string[]
  loading: boolean
  error: string | null
}

/**
 * 칩에 표시할 봉투 종류(distinct) 전체 목록을 1회 조회.
 * 뷰포트 결과만으로는 종류가 들쭉날쭉하므로 칩 구성은 별도 RPC 사용.
 */
export function useBagTypes(client: SupabaseClient | null): BagTypesState {
  const [bagOptions, setBagOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!client) {
      setBagOptions([])
      return
    }
    const ac = new AbortController()
    setLoading(true)
    setError(null)
    fetchAllBagTypes(client, ac.signal)
      .then((list) => {
        if (ac.signal.aborted) return
        setBagOptions(list)
      })
      .catch((e: unknown) => {
        if (ac.signal.aborted) return
        if (e instanceof Error && e.name === "AbortError") return
        setError(
          e instanceof Error ? e.message : "봉투 종류를 불러오지 못했습니다.",
        )
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false)
      })
    return () => ac.abort()
  }, [client])

  return { bagOptions, loading, error }
}
