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
import { useStoresQuery } from "./use-stores-query"
import { useVisibilityFilter } from "./use-visibility-filter"

const kakaoMapKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY ?? ""

export function MapExplorer() {
  const { position: mapCenter } = useGeolocation()
  const { stores, setStores, error: dataLoadError, loading: dataLoading } =
    useStoresQuery(supabase)

  const [searchQuery, setSearchQuery] = useState("")
  const [bagFilter, setBagFilter] = useState<string | null>(null)
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [recenterNonce, setRecenterNonce] = useState(0)

  const { bagOptions, visibleStores } = useVisibilityFilter({
    stores,
    searchQuery,
    bagFilter,
  })

  useEffect(() => {
    if (
      selectedStore &&
      !visibleStores.some((s) => s.id === selectedStore.id)
    ) {
      setSelectedStore(null)
    }
  }, [visibleStores, selectedStore])

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

  const showDataBanner =
    dataLoadError ||
    dataLoading ||
    (stores.length === 0 && !dataLoadError && !dataLoading)

  return (
    <div className="relative h-full min-h-0 w-full bg-background">
      <MapContainer
        appKey={kakaoMapKey}
        mapCenter={mapCenter}
        stores={visibleStores}
        selectedStoreId={selectedStore?.id ?? null}
        onSelectStore={handleSelectStore}
        recenterNonce={recenterNonce}
      />

      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        bagFilter={bagFilter}
        onBagFilterChange={setBagFilter}
        bagOptions={bagOptions}
      />

      <MyLocationButton onClick={() => setRecenterNonce((n) => n + 1)} />

      {showDataBanner && (
        <div className="pointer-events-none absolute top-28 right-3 left-3 z-10 max-h-40 overflow-y-auto">
          <Alert
            variant={dataLoadError ? "destructive" : "default"}
            className="pointer-events-auto border shadow-sm"
          >
            {dataLoading && (
              <>
                <AlertTitle>데이터 로딩</AlertTitle>
                <AlertDescription>
                  Supabase 에서 판매소 데이터를 불러오는 중입니다…
                </AlertDescription>
              </>
            )}
            {dataLoadError && (
              <>
                <AlertTitle>불러오기 실패</AlertTitle>
                <AlertDescription>{dataLoadError}</AlertDescription>
              </>
            )}
            {!dataLoading && !dataLoadError && stores.length === 0 && (
              <>
                <AlertTitle>데이터 없음</AlertTitle>
                <AlertDescription>
                  Supabase <code className="rounded bg-muted px-1">stores</code>{" "}
                  테이블이 비어 있습니다.{" "}
                  <code className="rounded bg-muted px-1">
                    npm run import:stores
                  </code>{" "}
                  로 적재한 뒤 다시 시도하세요.
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
