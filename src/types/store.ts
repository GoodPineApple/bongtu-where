export type StockStatus = "FULL" | "FEW" | "EMPTY"

export type Store = {
  id: string
  bizRegNo: string
  storeName: string
  address: string
  lat: number
  lng: number
  phone: string
  bagTypes: string[]
  stockStatus: StockStatus
  updatedAt: string
}
