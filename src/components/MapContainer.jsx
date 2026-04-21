import { useEffect, useRef, useState, useCallback } from "react"
import { stockMarkerColor } from "@/lib/markerColors"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import MapZoomControls from "@/components/MapZoomControls.jsx"

let kakaoSdkPromise = null
let kakaoSdkKey = ""

function mapsReady() {
  return Boolean(
    typeof window !== "undefined" &&
      window.kakao?.maps &&
      typeof window.kakao.maps.Map === "function",
  )
}

/** autoload=false 일 때 스크립트 onload 직후에는 Map 이 없음 → 반드시 maps.load 콜백 이후에 사용 */
function runAfterKakaoMapsLoad() {
  return new Promise((resolve, reject) => {
    if (mapsReady()) {
      resolve()
      return
    }
    if (!window.kakao?.maps?.load) {
      reject(
        new Error(
          "카카오 지도 스크립트는 로드됐지만 maps.load 를 사용할 수 없습니다. 앱 키·플랫폼 설정을 확인하세요.",
        ),
      )
      return
    }
    window.kakao.maps.load(() => {
      if (mapsReady()) resolve()
      else {
        reject(
          new Error(
            "카카오 지도 API가 준비되지 않았습니다. JavaScript 키와 [플랫폼]에 http://localhost:5173 등록을 확인하세요.",
          ),
        )
      }
    })
  })
}

function loadKakaoSdk(appKey) {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("브라우저에서만 지도를 사용할 수 있습니다."),
    )
  }

  if (mapsReady()) {
    return Promise.resolve()
  }

  if (kakaoSdkKey !== appKey) {
    document.querySelector("script[data-kakao-maps-sdk]")?.remove()
    kakaoSdkKey = appKey
    kakaoSdkPromise = null
  }

  if (!kakaoSdkPromise) {
    kakaoSdkPromise = new Promise((resolve, reject) => {
      const fail = (msg) => {
        kakaoSdkPromise = null
        reject(new Error(msg))
      }

      const existing = document.querySelector(
        "script[data-kakao-maps-sdk]",
      )
      if (existing) {
        if (mapsReady()) {
          resolve()
          return
        }
        const onScriptOrReady = () => {
          runAfterKakaoMapsLoad().then(resolve).catch((e) => fail(e.message))
        }
        if (window.kakao?.maps?.load) {
          onScriptOrReady()
        } else {
          existing.addEventListener("load", onScriptOrReady)
          existing.addEventListener("error", () =>
            fail(
              "Kakao 지도 스크립트 로드에 실패했습니다. 네트워크·광고 차단을 확인하세요.",
            ),
          )
          queueMicrotask(() => {
            if (window.kakao?.maps?.load) onScriptOrReady()
          })
        }
        return
      }

      const script = document.createElement("script")
      script.setAttribute("data-kakao-maps-sdk", "1")
      script.async = true
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`
      script.onload = () => {
        runAfterKakaoMapsLoad().then(resolve).catch((e) => fail(e.message))
      }
      script.onerror = () =>
        fail(
          "Kakao 지도 스크립트를 받지 못했습니다. 키·플랫폼 도메인·광고 차단을 확인하세요.",
        )
      document.head.appendChild(script)
    })
  }

  return kakaoSdkPromise
}

const MAX_VISIBLE_OVERLAYS = 600

/**
 * @param {HTMLElement} dotEl
 * @param {{ stockStatus: string }} store
 * @param {boolean} isSelected
 */
function styleDot(dotEl, store, isSelected) {
  const size = isSelected ? 20 : 16
  dotEl.style.width = `${size}px`
  dotEl.style.height = `${size}px`
  dotEl.style.background = stockMarkerColor(store.stockStatus)
}

/**
 * @param {{
 *   appKey: string
 *   mapCenter: { lat: number, lng: number }
 *   stores: import('../types/store.js').Store[]
 *   selectedStoreId: string | null
 *   onSelectStore: (store: import('../types/store.js').Store) => void
 *   recenterNonce: number
 * }} props
 */
export default function MapContainer({
  appKey,
  mapCenter,
  stores,
  selectedStoreId,
  onSelectStore,
  recenterNonce,
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)

  /** id → 원본 Store (목록 전체) */
  const storesByIdRef = useRef(new Map())
  /** id → { overlay, dotEl, currentStore } (생성된 적 있는 것만) */
  const overlaysCacheRef = useRef(new Map())
  /** 현재 지도에 setMap(map) 으로 켜져 있는 id 집합 */
  const visibleSetRef = useRef(new Set())
  const prevSelectedRef = useRef(null)
  const selectedStoreIdRef = useRef(selectedStoreId)
  const onSelectStoreRef = useRef(onSelectStore)
  selectedStoreIdRef.current = selectedStoreId
  onSelectStoreRef.current = onSelectStore

  const [sdkError, setSdkError] = useState(null)
  const [mapReady, setMapReady] = useState(false)
  const [overflowCount, setOverflowCount] = useState(0)

  const tearDownAllOverlays = useCallback(() => {
    for (const entry of overlaysCacheRef.current.values()) {
      try {
        entry.overlay.setMap(null)
      } catch {
        /* ignore */
      }
    }
    overlaysCacheRef.current.clear()
    visibleSetRef.current.clear()
  }, [])

  const ensureOverlay = useCallback((store) => {
    const cache = overlaysCacheRef.current
    const cached = cache.get(store.id)
    if (cached) {
      if (cached.currentStore !== store) {
        cached.currentStore = store
        const isSel = selectedStoreIdRef.current === store.id
        styleDot(cached.dotEl, store, isSel)
      }
      return cached
    }

    const wrap = document.createElement("button")
    wrap.type = "button"
    wrap.setAttribute("aria-label", store.storeName)
    wrap.style.cssText = [
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "width:44px",
      "height:44px",
      "min-width:44px",
      "min-height:44px",
      "padding:0",
      "margin:0",
      "border:0",
      "background:transparent",
      "cursor:pointer",
      "touch-action:manipulation",
      "-webkit-tap-highlight-color:transparent",
      "box-sizing:border-box",
      "transform:translate(-50%,-50%)",
    ].join(";")

    const dot = document.createElement("span")
    dot.setAttribute("aria-hidden", "true")
    dot.style.cssText = [
      "display:block",
      "border-radius:50%",
      "border:2px solid #fff",
      "box-shadow:0 1px 4px rgba(0,0,0,.35)",
      "pointer-events:none",
      "flex-shrink:0",
    ].join(";")
    const isSel = selectedStoreIdRef.current === store.id
    styleDot(dot, store, isSel)
    wrap.appendChild(dot)

    wrap.addEventListener("click", (ev) => {
      ev.stopPropagation()
      const latest = storesByIdRef.current.get(store.id) || store
      onSelectStoreRef.current?.(latest)
    })

    const pos = new window.kakao.maps.LatLng(store.lat, store.lng)
    const overlay = new window.kakao.maps.CustomOverlay({
      position: pos,
      content: wrap,
      yAnchor: 0.5,
      xAnchor: 0.5,
      clickable: true,
    })

    const entry = { overlay, dotEl: dot, currentStore: store }
    cache.set(store.id, entry)
    return entry
  }, [])

  const recomputeVisible = useCallback(() => {
    const map = mapRef.current
    if (!map || typeof map.getBounds !== "function") return

    const bounds = map.getBounds()
    const sw = bounds.getSouthWest()
    const ne = bounds.getNorthEast()
    const swLat = sw.getLat()
    const swLng = sw.getLng()
    const neLat = ne.getLat()
    const neLng = ne.getLng()

    const inBounds = []
    for (const store of storesByIdRef.current.values()) {
      if (
        store.lat >= swLat &&
        store.lat <= neLat &&
        store.lng >= swLng &&
        store.lng <= neLng
      ) {
        inBounds.push(store)
      }
    }

    let visibleStores = inBounds
    let overflow = 0
    if (inBounds.length > MAX_VISIBLE_OVERLAYS) {
      const cLat = (swLat + neLat) / 2
      const cLng = (swLng + neLng) / 2
      inBounds.sort((a, b) => {
        const da = (a.lat - cLat) ** 2 + (a.lng - cLng) ** 2
        const db = (b.lat - cLat) ** 2 + (b.lng - cLng) ** 2
        return da - db
      })
      overflow = inBounds.length - MAX_VISIBLE_OVERLAYS
      visibleStores = inBounds.slice(0, MAX_VISIBLE_OVERLAYS)
    }

    const nextVisible = new Set()
    for (const s of visibleStores) nextVisible.add(s.id)

    const prevVisible = visibleSetRef.current
    for (const id of prevVisible) {
      if (!nextVisible.has(id)) {
        const entry = overlaysCacheRef.current.get(id)
        if (entry) {
          try {
            entry.overlay.setMap(null)
          } catch {
            /* ignore */
          }
        }
      }
    }
    for (const store of visibleStores) {
      const entry = ensureOverlay(store)
      if (!prevVisible.has(store.id)) {
        try {
          entry.overlay.setMap(map)
        } catch {
          /* ignore */
        }
      }
    }

    visibleSetRef.current = nextVisible
    setOverflowCount(overflow)
  }, [ensureOverlay])

  useEffect(() => {
    if (!appKey || !containerRef.current) return undefined

    let cancelled = false
    let idleListener = null
    setSdkError(null)
    setMapReady(false)

    loadKakaoSdk(appKey)
      .then(() => {
        if (cancelled || !containerRef.current) return
        const center = new window.kakao.maps.LatLng(
          mapCenter.lat,
          mapCenter.lng,
        )
        const map = new window.kakao.maps.Map(containerRef.current, {
          center,
          level: 5,
          draggable: true,
          scrollwheel: true,
          disableDoubleClickZoom: false,
        })
        mapRef.current = map
        idleListener = () => recomputeVisible()
        if (window.kakao?.maps?.event) {
          window.kakao.maps.event.addListener(map, "idle", idleListener)
        }
        setMapReady(true)
      })
      .catch((e) => {
        if (!cancelled)
          setSdkError(e?.message || "지도를 불러오지 못했습니다.")
      })

    return () => {
      cancelled = true
      const map = mapRef.current
      if (map && idleListener && window.kakao?.maps?.event) {
        window.kakao.maps.event.removeListener(map, "idle", idleListener)
      }
      tearDownAllOverlays()
      mapRef.current = null
      prevSelectedRef.current = null
      setMapReady(false)
    }
  }, [appKey, mapCenter.lat, mapCenter.lng, recomputeVisible, tearDownAllOverlays])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map || !window.kakao?.maps) return
    const ll = new window.kakao.maps.LatLng(mapCenter.lat, mapCenter.lng)
    map.setCenter(ll)
  }, [mapCenter.lat, mapCenter.lng, mapReady])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map || !window.kakao?.maps) return
    if (recenterNonce < 1) return
    const ll = new window.kakao.maps.LatLng(mapCenter.lat, mapCenter.lng)
    map.panTo(ll)
  }, [recenterNonce, mapCenter.lat, mapCenter.lng, mapReady])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map || !window.kakao?.maps) return

    const incoming = new Map()
    for (const s of stores) incoming.set(s.id, s)

    for (const id of Array.from(overlaysCacheRef.current.keys())) {
      if (!incoming.has(id)) {
        const entry = overlaysCacheRef.current.get(id)
        try {
          entry.overlay.setMap(null)
        } catch {
          /* ignore */
        }
        overlaysCacheRef.current.delete(id)
        visibleSetRef.current.delete(id)
      }
    }

    storesByIdRef.current = incoming
    recomputeVisible()
  }, [stores, mapReady, recomputeVisible])

  useEffect(() => {
    if (!mapReady) return
    const prevId = prevSelectedRef.current
    if (prevId && prevId !== selectedStoreId) {
      const prev = overlaysCacheRef.current.get(prevId)
      if (prev) styleDot(prev.dotEl, prev.currentStore, false)
    }
    if (selectedStoreId) {
      const cur = overlaysCacheRef.current.get(selectedStoreId)
      if (cur) styleDot(cur.dotEl, cur.currentStore, true)
    }
    prevSelectedRef.current = selectedStoreId
  }, [selectedStoreId, mapReady])

  if (!appKey) {
    return (
      <div className="flex h-full items-center justify-center bg-muted/30 p-4">
        <Alert className="max-w-md">
          <AlertTitle>카카오 지도 키 필요</AlertTitle>
          <AlertDescription>
            <code className="rounded bg-muted px-1">.env</code>에{" "}
            <code className="rounded bg-muted px-1">VITE_KAKAO_MAP_APP_KEY</code>
            (JavaScript 키)를 넣고 개발 서버를 다시 실행하세요.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (sdkError) {
    return (
      <div className="flex h-full items-center justify-center bg-muted/30 p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>지도 로드 실패</AlertTitle>
          <AlertDescription>{sdkError}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full overscroll-contain">
      <div
        ref={containerRef}
        className="h-full w-full min-h-[200px] touch-auto"
        role="application"
        aria-label="지도"
      />
      <MapZoomControls map={mapRef.current} mapReady={mapReady} />
      {overflowCount > 0 && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-[5] -translate-x-1/2">
          <div className="pointer-events-auto rounded-full border border-border bg-card/95 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
            +{overflowCount}곳 · 지도를 확대하거나 검색해 보세요
          </div>
        </div>
      )}
    </div>
  )
}
