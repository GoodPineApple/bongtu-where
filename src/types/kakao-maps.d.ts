/** 카카오 지도 v2 SDK — 앱에서 쓰는 부분만 최소 선언 */
export {}

type KakaoLatLng = object

interface KakaoMap {
  getBounds: () => {
    getSouthWest: () => { getLat: () => number; getLng: () => number }
    getNorthEast: () => { getLat: () => number; getLng: () => number }
  }
  setCenter: (ll: KakaoLatLng) => void
  panTo: (ll: KakaoLatLng) => void
  getLevel: () => number
  setLevel: (level: number) => void
}

interface KakaoCustomOverlay {
  setMap: (map: KakaoMap | null) => void
}

declare global {
  interface Window {
    kakao?: {
      maps: {
        load: (cb: () => void) => void
        LatLng: new (lat: number, lng: number) => KakaoLatLng
        Map: new (
          container: HTMLElement,
          options: Record<string, unknown>,
        ) => KakaoMap
        CustomOverlay: new (options: Record<string, unknown>) => KakaoCustomOverlay
        event?: {
          addListener: (
            target: KakaoMap,
            type: string,
            handler: () => void,
          ) => void
          removeListener: (
            target: KakaoMap,
            type: string,
            handler: () => void,
          ) => void
        }
      }
    }
  }
}
