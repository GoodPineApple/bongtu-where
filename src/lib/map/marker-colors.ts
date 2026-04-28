import type { StockStatus } from "@/types/store"

export function stockMarkerColor(status: StockStatus | string): string {
  switch (status) {
    case "FULL":
      return "#22C55E"
    case "FEW":
      return "#F59E0B"
    case "EMPTY":
      return "#EF4444"
    default:
      return "#6B7280"
  }
}
