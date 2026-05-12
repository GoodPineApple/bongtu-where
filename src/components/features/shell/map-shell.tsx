"use client"

import { useRouter } from "next/navigation"
import { MapExplorer } from "@/components/features/map-explorer/map-explorer"

export type MapShellProps = {
  bootstrapSearchQuery: string | null
}

export function MapShell({ bootstrapSearchQuery }: MapShellProps) {
  const router = useRouter()

  return (
    <MapExplorer
      bootstrapSearchQuery={bootstrapSearchQuery}
      onBootstrapSearchConsumed={() => {
        router.replace("/map", { scroll: false })
      }}
    />
  )
}
