"use client"

import { useSyncExternalStore } from "react"

/**
 * SSR 시 false(모바일 우선). 클라이언트에서만 실제 미디어쿼리를 구독합니다.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia(query)
      mq.addEventListener("change", onStoreChange)
      return () => mq.removeEventListener("change", onStoreChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
