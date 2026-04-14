/**
 * @typedef {'FULL' | 'FEW' | 'EMPTY'} StockStatus
 */

/**
 * @typedef {Object} Store
 * @property {string} id - DB·앱 공통 PK (UUID 문자열, 사업자번호와 무관)
 * @property {string} bizRegNo - 사업자등록번호, 없으면 빈 문자열
 * @property {string} storeName
 * @property {string} address
 * @property {number} lat
 * @property {number} lng
 * @property {string} phone
 * @property {string[]} bagTypes
 * @property {StockStatus} stockStatus
 * @property {string} updatedAt
 */

export {}
