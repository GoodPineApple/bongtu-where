"use client"

import { useState, useEffect } from "react"
import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

/** 카카오맵: level 숫자가 작을수록 확대(가까이) */
const MIN_LEVEL = 1
const MAX_LEVEL = 14

type MapLike = {
  getLevel: () => number
  setLevel: (n: number) => void
}

type Props = {
  map: MapLike | null
  mapReady: boolean
}

export function MapZoomControls({ map, mapReady }: Props) {
  const [, setLevelTick] = useState(0)

  useEffect(() => {
    if (!mapReady || !map || !window.kakao?.maps?.event) return undefined
    const handle = () => setLevelTick((n) => n + 1)
    window.kakao.maps.event.addListener(map as never, "zoom_changed", handle)
    return () => {
      window.kakao?.maps?.event?.removeListener(
        map as never,
        "zoom_changed",
        handle,
      )
    }
  }, [map, mapReady])

  if (!mapReady || !map) return null

  const level = map.getLevel()
  const zoomIn = () => {
    const cur = map.getLevel()
    map.setLevel(Math.max(MIN_LEVEL, cur - 1))
    setLevelTick((n) => n + 1)
  }
  const zoomOut = () => {
    const cur = map.getLevel()
    map.setLevel(Math.min(MAX_LEVEL, cur + 1))
    setLevelTick((n) => n + 1)
  }

  const atMin = level <= MIN_LEVEL
  const atMax = level >= MAX_LEVEL

  return (
    <div
      className="pointer-events-none absolute right-3 bottom-40 z-[5] flex flex-col gap-1"
      role="toolbar"
      aria-label="지도 확대·축소"
    >
      <Button
        type="button"
        variant="secondary"
        size="icon"
        disabled={atMin}
        className="pointer-events-auto size-11 min-h-11 min-w-11 touch-manipulation rounded-full shadow-md"
        aria-label="지도 확대"
        onClick={zoomIn}
      >
        <Plus className="size-5" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        disabled={atMax}
        className="pointer-events-auto size-11 min-h-11 min-w-11 touch-manipulation rounded-full shadow-md"
        aria-label="지도 축소"
        onClick={zoomOut}
      >
        <Minus className="size-5" aria-hidden />
      </Button>
    </div>
  )
}
