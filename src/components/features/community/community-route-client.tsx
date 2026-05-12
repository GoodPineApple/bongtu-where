"use client"

import { useRouter } from "next/navigation"
import { CommunityView } from "@/components/features/community/community-view"

export function CommunityRouteClient() {
  const router = useRouter()

  return (
    <CommunityView
      onRequestMapTab={(hint) => {
        if (hint?.trim()) {
          router.push(`/map?q=${encodeURIComponent(hint.trim())}`)
        } else {
          router.push("/map")
        }
      }}
    />
  )
}
