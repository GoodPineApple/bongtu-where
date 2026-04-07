import { useEffect, useRef, useState, useCallback } from "react";
import { stockMarkerColor } from "../lib/markerColors";

function loadKakaoSdk(appKey) {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("no window"));
      return;
    }
    if (window.kakao?.maps) {
      window.kakao.maps.load(() => resolve());
      return;
    }
    const existing = document.querySelector("script[data-kakao-maps-sdk]");
    if (existing) {
      existing.addEventListener("load", () => {
        window.kakao.maps.load(() => resolve());
      });
      existing.addEventListener("error", () =>
        reject(new Error("Kakao SDK 로드 실패")),
      );
      return;
    }
    const script = document.createElement("script");
    script.setAttribute("data-kakao-maps-sdk", "1");
    script.async = true;
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
    script.onload = () => {
      window.kakao.maps.load(() => resolve());
    };
    script.onerror = () => reject(new Error("Kakao SDK 로드 실패"));
    document.head.appendChild(script);
  });
}

/**
 * @param {{
 *   appKey: string
 *   userPosition: { lat: number, lng: number }
 *   stores: import('../types/store.js').Store[]
 *   selectedStoreId: string | null
 *   onSelectStore: (store: import('../types/store.js').Store) => void
 *   recenterNonce: number
 * }} props
 */
export default function MapContainer({
  appKey,
  userPosition,
  stores,
  selectedStoreId,
  onSelectStore,
  recenterNonce,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const overlaysRef = useRef([]);
  const [sdkError, setSdkError] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  const clearOverlays = useCallback(() => {
    overlaysRef.current.forEach((o) => {
      try {
        o.setMap(null);
      } catch {
        /* ignore */
      }
    });
    overlaysRef.current = [];
  }, []);

  useEffect(() => {
    if (!appKey || !containerRef.current) return undefined;

    let cancelled = false;
    setSdkError(null);
    setMapReady(false);

    loadKakaoSdk(appKey)
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const center = new window.kakao.maps.LatLng(
          userPosition.lat,
          userPosition.lng,
        );
        const map = new window.kakao.maps.Map(containerRef.current, {
          center,
          level: 5,
        });
        mapRef.current = map;
        setMapReady(true);
      })
      .catch((e) => {
        if (!cancelled)
          setSdkError(e?.message || "지도를 불러오지 못했습니다.");
      });

    return () => {
      cancelled = true;
      clearOverlays();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [appKey, clearOverlays]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !window.kakao?.maps) return;
    const ll = new window.kakao.maps.LatLng(userPosition.lat, userPosition.lng);
    map.setCenter(ll);
  }, [userPosition.lat, userPosition.lng, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !window.kakao?.maps) return;
    if (recenterNonce < 1) return;
    const ll = new window.kakao.maps.LatLng(userPosition.lat, userPosition.lng);
    map.panTo(ll);
  }, [recenterNonce, userPosition.lat, userPosition.lng, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !window.kakao?.maps) return;

    clearOverlays();

    stores.forEach((store) => {
      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", store.storeName);
      const isSelected = selectedStoreId === store.id;
      const size = isSelected ? 18 : 14;
      const color = stockMarkerColor(store.stockStatus);
      el.style.cssText = [
        `width:${size}px`,
        `height:${size}px`,
        "border-radius:50%",
        "border:2px solid #fff",
        "box-shadow:0 1px 4px rgba(0,0,0,.35)",
        `background:${color}`,
        "cursor:pointer",
        "padding:0",
        "transform:translate(-50%,-50%)",
      ].join(";");

      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        onSelectStore(store);
      });

      const pos = new window.kakao.maps.LatLng(store.lat, store.lng);
      const overlay = new window.kakao.maps.CustomOverlay({
        position: pos,
        content: el,
        yAnchor: 0.5,
        xAnchor: 0.5,
        clickable: true,
      });
      overlay.setMap(map);
      overlaysRef.current.push(overlay);
    });
  }, [stores, mapReady, clearOverlays, onSelectStore, selectedStoreId]);

  if (!appKey) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-100 px-4 text-center text-sm text-slate-600">
        <p>
          <code className="rounded bg-slate-200 px-1">.env</code>에{" "}
          <code className="rounded bg-slate-200 px-1">
            VITE_KAKAO_MAP_APP_KEY
          </code>
          를 설정한 뒤 다시 실행하세요.
        </p>
      </div>
    );
  }

  if (sdkError) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-100 px-4 text-center text-sm text-red-600">
        {sdkError}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      role="application"
      aria-label="지도"
    />
  );
}
