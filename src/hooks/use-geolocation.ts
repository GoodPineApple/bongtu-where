"use client"

import { useState, useEffect } from "react"
import { DEFAULT_MAP_CENTER } from "@/lib/geo/default-map-center"
import type { LatLng } from "@/lib/geo/distance"

export type GeolocationState = {
  position: LatLng
  status: "pending" | "ok" | "error"
  error: string | null
}

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    position: DEFAULT_MAP_CENTER,
    status: "pending",
    error: null,
  })

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({
        position: DEFAULT_MAP_CENTER,
        status: "error",
        error: "이 브라우저는 위치 정보를 지원하지 않습니다.",
      })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          position: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          },
          status: "ok",
          error: null,
        })
      },
      () => {
        setState({
          position: DEFAULT_MAP_CENTER,
          status: "error",
          error: "위치 권한이 없어 서울 시청 근처를 기준으로 표시합니다.",
        })
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    )
  }, [])

  return state
}
