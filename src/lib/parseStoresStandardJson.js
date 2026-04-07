const BAG_SPLIT = /[,，、/|]+/

function splitBagTypes(raw) {
  if (raw == null || String(raw).trim() === '') return []
  return String(raw)
    .split(BAG_SPLIT)
    .map((s) => s.trim())
    .filter(Boolean)
}

function pickAddress(row) {
  const road = row['소재지도로명주소']
  const jibun = row['소재지지번주소']
  const r = road != null && String(road).trim() !== '' ? String(road).trim() : ''
  if (r) return r
  const j = jibun != null && String(jibun).trim() !== '' ? String(jibun).trim() : ''
  return j
}

/**
 * 공공데이터포털 표준 JSON: { fields, records }
 * @param {unknown} data
 */
export function parseStoresStandardJson(data) {
  const errors = []
  if (data == null || typeof data !== 'object') {
    errors.push('데이터 형식이 올바르지 않습니다.')
    return { stores: [], errors }
  }

  const records = 'records' in data ? data.records : null
  if (!Array.isArray(records)) {
    errors.push('records 배열이 없습니다.')
    return { stores: [], errors }
  }

  const now = new Date().toISOString()
  const stores = []

  records.forEach((row, index) => {
    if (!row || typeof row !== 'object') return
    const name = row['판매소명']
    if (name == null || String(name).trim() === '') return

    const lat = parseFloat(row['위도'])
    const lng = parseFloat(row['경도'])
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

    const biz = row['사업자등록번호']
    const id =
      biz != null && String(biz).trim() !== ''
        ? String(biz).trim()
        : `row-${index}`

    const bagRaw = row['판매대상종량제봉투종류']

    stores.push({
      id,
      storeName: String(name).trim(),
      address: pickAddress(row),
      lat,
      lng,
      phone: row['전화번호'] != null ? String(row['전화번호']).trim() : '',
      bagTypes: splitBagTypes(bagRaw),
      stockStatus: 'FULL',
      updatedAt: now,
    })
  })

  if (stores.length === 0) {
    errors.push('유효한 위도·경도·판매소명이 있는 레코드가 없습니다.')
  }

  return { stores, errors }
}
