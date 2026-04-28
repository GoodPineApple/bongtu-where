import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import MapContainer from "@/components/MapContainer.jsx"
import FilterBar from "@/components/FilterBar.jsx"
import MyLocationButton from "@/components/MyLocationButton.jsx"
import StoreBottomSheet from "@/components/StoreBottomSheet.jsx"
import { Toaster } from "@/components/ui/sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useGeolocation } from "@/hooks/useGeolocation.js"
import { supabase } from "@/lib/supabaseClient.js"
import { fetchAllStores } from "@/lib/fetchStores.js"
import { dbRowToStore, STORES_SELECT_COLUMNS } from "@/lib/storeToDbRow.js"

const KAKAO_KEY = import.meta.env.VITE_KAKAO_MAP_APP_KEY || ""

export default function App() {
  const { position: mapCenter } = useGeolocation()
  const [stores, setStores] = useState([])
  const [dataLoadError, setDataLoadError] = useState(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [bagFilter, setBagFilter] = useState(null)
  const [selectedStore, setSelectedStore] = useState(null)
  const [recenterNonce, setRecenterNonce] = useState(0)

  useEffect(() => {
    if (!supabase) {
      setStores([])
      setDataLoading(false)
      setDataLoadError(
        "Supabase 환경 변수가 설정되지 않았습니다. .env 의 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 를 확인하세요.",
      )
      return undefined
    }

    let cancelled = false
    setDataLoadError(null)
    setDataLoading(true)

    fetchAllStores(supabase)
      .then((next) => {
        if (cancelled) return
        setStores(next)
      })
      .catch((e) => {
        if (cancelled) return
        setStores([])
        setDataLoadError(e?.message || "판매소 데이터를 불러오지 못했습니다.")
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const bagOptions = useMemo(() => {
    const set = new Set()
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

  useEffect(() => {
    if (
      selectedStore &&
      !visibleStores.some((s) => s.id === selectedStore.id)
    ) {
      setSelectedStore(null)
    }
  }, [visibleStores, selectedStore])

  const handleSelectStore = useCallback((store) => {
    setSelectedStore(store)
  }, [])

  const handleReport = useCallback(
    /** 시트는 호출부에서 먼저 닫고, 여기서는 목록·서버만 비동기 처리 */
    async (status) => {
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
        const { error: insertError } = await supabase
          .from("stock_reports")
          .insert({
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

        const labels = {
          FULL: "재고 있음으로 반영했습니다.",
          FEW: "소량 남음으로 반영했습니다.",
          EMPTY: "품절로 반영했습니다.",
        }
        toast.success(labels[status] || "반영했습니다.")
      } catch (e) {
        setStores((prev) =>
          prev.map((s) =>
            s.id === id
              ? { ...s, stockStatus: previousStatus, updatedAt: previousUpdatedAt }
              : s,
          ),
        )
        toast.error(e?.message || "제보 저장에 실패했습니다.")
      }
    },
    [selectedStore],
  )

  const showDataBanner =
    dataLoadError ||
    dataLoading ||
    (stores.length === 0 && !dataLoadError && !dataLoading)

  return (
    <div className="relative h-full min-h-0 w-full bg-background">
      <MapContainer
        appKey={KAKAO_KEY}
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

      <Toaster richColors position="bottom-center" />
    </div>
  )
}
