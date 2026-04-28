"use client"

import { useMemo } from "react"
import type { Store } from "@/types/store"

export type VisibilityFilterInput = {
  stores: Store[]
  searchQuery: string
  bagFilter: string | null
}

export function useVisibilityFilter({
  stores,
  searchQuery,
  bagFilter,
}: VisibilityFilterInput) {
  const bagOptions = useMemo(() => {
    const set = new Set<string>()
    stores.forEach((s) => s.bagTypes.forEach((t) => set.add(t)))
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ko"))
  }, [stores])

  const visibleStores = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return stores.filter((s) => {
      if (bagFilter != null && !s.bagTypes.includes(bagFilter)) return false
      if (!q) return true
      const name = s.storeName.toLowerCase()
      const addr = (s.address || "").toLowerCase()
      return name.includes(q) || addr.includes(q)
    })
  }, [stores, searchQuery, bagFilter])

  return { bagOptions, visibleStores }
}
