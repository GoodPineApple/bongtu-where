import { v5 as uuidv5 } from "uuid"

/** 앱 전역 고정 네임스페이스(UUID v5). 공공데이터 레코드마다 고유·재현 가능한 store id */
const STORE_ID_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"

export type StableStoreIdInput = {
  storeName: string
  lat: number
  lng: number
  bizRegNo: string
  sourceIndex: number
}

export function stableStoreId(p: StableStoreIdInput): string {
  const name = String(p.storeName).trim()
  const biz = String(p.bizRegNo ?? "").trim()
  const payload = `${name}\t${p.lat}\t${p.lng}\t${biz}\t${p.sourceIndex}`
  return uuidv5(payload, STORE_ID_NAMESPACE)
}
