import { stableStoreId } from "@/lib/ids/stable-store-id"
import type { StockStatus, Store } from "@/types/store"

const BAG_SPLIT = /[,，、/|]+/

function splitBagTypes(raw: unknown): string[] {
  if (raw == null || String(raw).trim() === "") return []
  return String(raw)
    .split(BAG_SPLIT)
    .map((s) => s.trim())
    .filter(Boolean)
}

function pickAddress(row: Record<string, unknown>): string {
  const road = row["소재지도로명주소"]
  const jibun = row["소재지지번주소"]
  const r =
    road != null && String(road).trim() !== "" ? String(road).trim() : ""
  if (r) return r
  const j =
    jibun != null && String(jibun).trim() !== "" ? String(jibun).trim() : ""
  return j
}

/** 공공데이터포털 표준 JSON: { fields, records } */
export function parseStoresStandardJson(data: unknown): {
  stores: Store[]
  errors: string[]
} {
  const errors: string[] = []
  if (data == null || typeof data !== "object") {
    errors.push("데이터 형식이 올바르지 않습니다.")
    return { stores: [], errors }
  }

  const records =
    "records" in data && Array.isArray((data as { records: unknown }).records)
      ? (data as { records: unknown[] }).records
      : null
  if (!records) {
    errors.push("records 배열이 없습니다.")
    return { stores: [], errors }
  }

  const now = new Date().toISOString()
  const stores: Store[] = []
  const defaultStock: StockStatus = "FULL"

  records.forEach((raw, index) => {
    if (!raw || typeof raw !== "object") return
    const row = raw as Record<string, unknown>
    const name = row["판매소명"]
    if (name == null || String(name).trim() === "") return

    const lat = parseFloat(String(row["위도"]))
    const lng = parseFloat(String(row["경도"]))
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

    const bizRaw = row["사업자등록번호"]
    const bizRegNo =
      bizRaw != null && String(bizRaw).trim() !== ""
        ? String(bizRaw).trim()
        : ""

    const id = stableStoreId({
      storeName: String(name).trim(),
      lat,
      lng,
      bizRegNo,
      sourceIndex: index,
    })

    const bagRaw = row["판매대상종량제봉투종류"]

    stores.push({
      id,
      bizRegNo,
      storeName: String(name).trim(),
      address: pickAddress(row),
      lat,
      lng,
      phone:
        row["전화번호"] != null ? String(row["전화번호"]).trim() : "",
      bagTypes: splitBagTypes(bagRaw),
      stockStatus: defaultStock,
      updatedAt: now,
    })
  })

  if (stores.length === 0) {
    errors.push("유효한 위도·경도·판매소명이 있는 레코드가 없습니다.")
  }

  return { stores, errors }
}
