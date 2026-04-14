import { v5 as uuidv5 } from "uuid"

/** 앱 전역 고정 네임스페이스(UUID v5 규격). 공공데이터 레코드마다 고유·재현 가능한 store id 생성에 사용 */
const STORE_ID_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"

/**
 * JSON records 배열 인덱스까지 포함해 행 단위로 고유 id를 만듭니다. (사업자번호와 무관)
 * @param {{ storeName: string, lat: number, lng: number, bizRegNo: string, sourceIndex: number }} p
 */
export function stableStoreId(p) {
  const name = String(p.storeName).trim()
  const biz = String(p.bizRegNo ?? "").trim()
  const payload = `${name}\t${p.lat}\t${p.lng}\t${biz}\t${p.sourceIndex}`
  return uuidv5(payload, STORE_ID_NAMESPACE)
}
