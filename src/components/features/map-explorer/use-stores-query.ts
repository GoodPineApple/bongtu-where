"use client"

import {
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
} from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { fetchAllStores } from "@/lib/data/fetch-stores"
import type { Store } from "@/types/store"

export type StoresQueryState = {
  stores: Store[]
  setStores: Dispatch<SetStateAction<Store[]>>
  error: string | null
  loading: boolean
  reload: () => void
}

export function useStoresQuery(client: SupabaseClient | null): StoresQueryState {
  const [stores, setStores] = useState<Store[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [nonce, setNonce] = useState(0)

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    if (!client) {
      setStores([])
      setLoading(false)
      setError(
        "Supabase 환경 변수가 설정되지 않았습니다. .env 의 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 를 확인하세요.",
      )
      return undefined
    }

    let cancelled = false
    setError(null)
    setLoading(true)

    fetchAllStores(client)
      .then((next) => {
        if (cancelled) return
        setStores(next)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setStores([])
        setError(
          e instanceof Error ? e.message : "판매소 데이터를 불러오지 못했습니다.",
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [client, nonce])

  return { stores, setStores, error, loading, reload }
}
