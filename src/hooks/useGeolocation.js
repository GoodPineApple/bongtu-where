import { useState, useEffect } from 'react'

const SEOUL_DEFAULT = { lat: 37.5665, lng: 126.978 }

/**
 * @returns {{ position: { lat: number, lng: number }, status: 'pending' | 'ok' | 'error', error: string | null }}
 */
export function useGeolocation() {
  const [state, setState] = useState({
    position: SEOUL_DEFAULT,
    status: 'pending',
    error: null,
  })

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ position: SEOUL_DEFAULT, status: 'error', error: '이 브라우저는 위치 정보를 지원하지 않습니다.' })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          status: 'ok',
          error: null,
        })
      },
      () => {
        setState({
          position: SEOUL_DEFAULT,
          status: 'error',
          error: '위치 권한이 없어 서울 시청 근처를 기준으로 표시합니다.',
        })
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    )
  }, [])

  return state
}

export { SEOUL_DEFAULT }
