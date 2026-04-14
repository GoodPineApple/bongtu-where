/**
 * @param {import('../types/store.js').Store} s
 * @returns {Record<string, unknown>}
 */
export function storeToStoresTableRow(s) {
  return {
    id: s.id,
    biz_reg_no: s.bizRegNo,
    store_name: s.storeName,
    address: s.address,
    lat: s.lat,
    lng: s.lng,
    phone: s.phone,
    bag_types: s.bagTypes,
    stock_status: s.stockStatus,
    updated_at: s.updatedAt,
  }
}
