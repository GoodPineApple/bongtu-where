"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { MapContainer } from "@/components/features/map/map-container"
import { FilterBar } from "@/components/features/shell/filter-bar"
import { MyLocationButton } from "@/components/features/shell/my-location-button"
import { StoreBottomSheet } from "@/components/features/store/store-bottom-sheet"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useGeolocation } from "@/hooks/use-geolocation"
import { dbRowToStore, STORES_SELECT_COLUMNS } from "@/lib/data/store-to-db-row"
import { supabase } from "@/lib/supabase/browser-client"
import type { StockStatus, Store } from "@/types/store"
import { useBagTypes } from "./use-bag-types"
import { useViewportStores } from "./use-viewport-stores"

const kakaoMapKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY ?? ""

export type MapExplorerProps = {
  /** 커뮤니티 등에서 지도 탭으로 넘어올 때 검색창에 한 번 채울 문자열 */
  bootstrapSearchQuery?: string | null
  onBootstrapSearchConsumed?: () => void
}

export function MapExplorer({
  bootstrapSearchQuery = null,
  onBootstrapSearchConsumed,
}: MapExplorerProps = {}) {
  const { position: mapCenter } = useGeolocation()

  const [searchQuery, setSearchQuery] = useState("")
  const [bagFilter, setBagFilter] = useState<string | null>(null)
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [recenterNonce, setRecenterNonce] = useState(0)

  useEffect(() => {
    if (bootstrapSearchQuery == null || bootstrapSearchQuery === "") return
    setSearchQuery(bootstrapSearchQuery)
    onBootstrapSearchConsumed?.()
  }, [bootstrapSearchQuery, onBootstrapSearchConsumed])

  const {
    stores,
    setStores,
    loading: dataLoading,
    error: dataLoadError,
    truncated,
    setBounds,
  } = useViewportStores(supabase, { query: searchQuery, bagFilter })

  const { bagOptions } = useBagTypes(supabase)

  useEffect(() => {
    if (!selectedStore) return
    if (!stores.some((s) => s.id === selectedStore.id)) {
      setSelectedStore(null)
    }
  }, [stores, selectedStore])

  const handleSelectStore = useCallback((store: Store) => {
    setSelectedStore(store)
  }, [])

  const handleReport = useCallback(
    async (status: StockStatus) => {
      const target = selectedStore
      if (!target) return
      if (!supabase) {
        toast.error("Supabase 가 설정되지 않아 제보를 저장할 수 없습니다.")
        return
      }

      const id = target.id
      const previousStatus = target.stockStatus
      const previousUpdatedAt = target.updatedAt
      const optimisticAt = new Date().toISOString()

      setStores((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, stockStatus: status, updatedAt: optimisticAt }
            : s,
        ),
      )

      try {
        const { error: insertError } = await supabase.from("stock_reports").insert({
          store_id: id,
          previous_status: previousStatus,
          reported_status: status,
        })
        if (insertError)
          throw new Error(insertError.message || "제보 저장 실패")

        const { data, error: selectError } = await supabase
          .from("stores")
          .select(STORES_SELECT_COLUMNS)
          .eq("id", id)
          .maybeSingle()

        if (!selectError && data) {
          const fresh = dbRowToStore(data)
          if (fresh) {
            setStores((prev) => prev.map((s) => (s.id === id ? fresh : s)))
            setSelectedStore((prev) =>
              prev && prev.id === id ? fresh : prev,
            )
          }
        }

        const labels: Record<StockStatus, string> = {
          FULL: "재고 있음으로 반영했습니다.",
          FEW: "소량 남음으로 반영했습니다.",
          EMPTY: "품절로 반영했습니다.",
        }
        toast.success(labels[status] ?? "반영했습니다.")
      } catch (e) {
        setStores((prev) =>
          prev.map((s) =>
            s.id === id
              ? {
                  ...s,
                  stockStatus: previousStatus,
                  updatedAt: previousUpdatedAt,
                }
              : s,
          ),
        )
        toast.error(
          e instanceof Error ? e.message : "제보 저장에 실패했습니다.",
        )
      }
    },
    [selectedStore, setStores],
  )

  const showBanner = Boolean(dataLoadError) || truncated

  return (
    <div className="relative h-full min-h-0 w-full bg-background">
      <MapContainer
        appKey={kakaoMapKey}
        mapCenter={mapCenter}
        stores={stores}
        selectedStoreId={selectedStore?.id ?? null}
        onSelectStore={handleSelectStore}
        recenterNonce={recenterNonce}
        onViewportBoundsChange={setBounds}
      />

      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        bagFilter={bagFilter}
        onBagFilterChange={setBagFilter}
        bagOptions={bagOptions}
      />

      <MyLocationButton onClick={() => setRecenterNonce((n) => n + 1)} />

      {dataLoading && (
        <div className="pointer-events-none absolute top-28 left-1/2 z-10 -translate-x-1/2">
          <div className="rounded-full border border-border bg-card/95 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
            판매소 불러오는 중…
          </div>
        </div>
      )}

      {showBanner && (
        <div className="pointer-events-none absolute top-28 right-3 left-3 z-10 max-h-40 overflow-y-auto">
          <Alert
            variant={dataLoadError ? "destructive" : "default"}
            className="pointer-events-auto border shadow-sm"
          >
            {dataLoadError ? (
              <>
                <AlertTitle>불러오기 실패</AlertTitle>
                <AlertDescription>{dataLoadError}</AlertDescription>
              </>
            ) : (
              <>
                <AlertTitle>결과가 너무 많습니다</AlertTitle>
                <AlertDescription>
                  현재 화면 영역에서 결과 상한에 도달했습니다. 지도를 확대하거나
                  검색·필터를 좁혀 보세요.
                </AlertDescription>
              </>
            )}
          </Alert>
        </div>
      )}

      <StoreBottomSheet
        store={selectedStore}
        distanceOrigin={mapCenter}
        onClose={() => setSelectedStore(null)}
        onReport={handleReport}
      />
    </div>
  )
}
