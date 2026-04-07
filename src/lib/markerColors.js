/** @param {'FULL' | 'FEW' | 'EMPTY' | string} status */
export function stockMarkerColor(status) {
  switch (status) {
    case 'FULL':
      return '#22C55E'
    case 'FEW':
      return '#F59E0B'
    case 'EMPTY':
      return '#EF4444'
    default:
      return '#6B7280'
  }
}
