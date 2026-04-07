import { useCallback, useEffect, useMemo, useState } from "react";
import MapContainer from "./components/MapContainer.jsx";
import FilterBar from "./components/FilterBar.jsx";
import MyLocationButton from "./components/MyLocationButton.jsx";
import StoreBottomSheet from "./components/StoreBottomSheet.jsx";
import Toast from "./components/Toast.jsx";
import { useGeolocation } from "./hooks/useGeolocation.js";
import { parseStoresStandardJson } from "./lib/parseStoresStandardJson.js";

const KAKAO_KEY = import.meta.env.VITE_KAKAO_MAP_APP_KEY || "";

/** @type {string} 공공데이터 표준 JSON (public 정적 파일) */
const STORES_JSON_URL = "/전국종량제봉투판매소표준데이터.json";

export default function App() {
  const { position: userPosition } = useGeolocation();
  const [stores, setStores] = useState([]);
  const [dataErrors, setDataErrors] = useState([]);
  const [dataLoadError, setDataLoadError] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [bagFilter, setBagFilter] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [toast, setToast] = useState(null);
  const [recenterNonce, setRecenterNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setDataLoadError(null);
    setDataErrors([]);
    setDataLoading(true);

    fetch(STORES_JSON_URL)
      .then((res) => {
        if (!res.ok)
          throw new Error(
            `판매소 데이터를 불러오지 못했습니다. (${res.status})`,
          );
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        const { stores: next, errors } = parseStoresStandardJson(json);
        console.log(next);
        setStores(next);
        setDataErrors(errors);
      })
      .catch((e) => {
        if (!cancelled) setDataLoadError(e?.message || "데이터 로드 실패");
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const bagOptions = useMemo(() => {
    const set = new Set();
    stores.forEach((s) => s.bagTypes.forEach((t) => set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ko"));
  }, [stores]);

  const visibleStores = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return stores.filter((s) => {
      if (bagFilter != null && !s.bagTypes.includes(bagFilter)) return false;
      if (!q) return true;
      const name = s.storeName.toLowerCase();
      const addr = (s.address || "").toLowerCase();
      return name.includes(q) || addr.includes(q);
    });
  }, [stores, searchQuery, bagFilter]);

  useEffect(() => {
    if (
      selectedStore &&
      !visibleStores.some((s) => s.id === selectedStore.id)
    ) {
      setSelectedStore(null);
    }
  }, [visibleStores, selectedStore]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleSelectStore = useCallback((store) => {
    setSelectedStore(store);
  }, []);

  const handleReport = useCallback(
    (status) => {
      if (!selectedStore) return;
      const id = selectedStore.id;
      const now = new Date().toISOString();
      setStores((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, stockStatus: status, updatedAt: now } : s,
        ),
      );
      setSelectedStore((prev) =>
        prev && prev.id === id
          ? { ...prev, stockStatus: status, updatedAt: now }
          : prev,
      );
      const labels = {
        FULL: "재고 있음으로 반영했습니다.",
        FEW: "소량 남음으로 반영했습니다.",
        EMPTY: "품절로 반영했습니다.",
      };
      setToast(labels[status] || "반영했습니다.");
    },
    [selectedStore],
  );

  const showDataBanner =
    dataLoadError ||
    dataErrors.length > 0 ||
    dataLoading ||
    (stores.length === 0 && !dataLoadError && !dataLoading);

  return (
    <div className="relative h-full w-full bg-slate-50">
      <MapContainer
        appKey={KAKAO_KEY}
        userPosition={userPosition}
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
        <div className="pointer-events-none absolute left-3 right-3 top-28 z-10 max-h-32 overflow-y-auto rounded-lg bg-amber-50/95 px-3 py-2 text-xs text-amber-900 shadow ring-1 ring-amber-200">
          {dataLoading && (
            <p className="pointer-events-auto">
              판매소 데이터를 불러오는 중입니다…
            </p>
          )}
          {dataLoadError && (
            <p className="pointer-events-auto">{dataLoadError}</p>
          )}
          {!dataLoading &&
            !dataLoadError &&
            dataErrors.map((err, i) => (
              <p key={i} className="pointer-events-auto">
                {err}
              </p>
            ))}
          {!dataLoading && !dataLoadError && stores.length === 0 && (
            <p className="pointer-events-auto">
              <code className="rounded bg-amber-100 px-1">
                public/전국종량제봉투판매소표준데이터.json
              </code>{" "}
              파일을 확인하세요.
            </p>
          )}
        </div>
      )}

      <StoreBottomSheet
        store={selectedStore}
        userPosition={userPosition}
        onClose={() => setSelectedStore(null)}
        onReport={handleReport}
      />

      <Toast message={toast} />
    </div>
  );
}
