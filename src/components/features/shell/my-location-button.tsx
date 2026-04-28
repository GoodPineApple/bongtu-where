"use client"

import { LocateFixed } from "lucide-react"
import { Button } from "@/components/ui/button"

export type MyLocationButtonProps = {
  onClick: () => void
}

export function MyLocationButton({ onClick }: MyLocationButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className="pointer-events-auto absolute right-3 bottom-24 z-10 size-11 rounded-full shadow-md"
      onClick={onClick}
      aria-label="지도 기준점으로 이동"
    >
      <LocateFixed className="size-5" />
    </Button>
  )
}
