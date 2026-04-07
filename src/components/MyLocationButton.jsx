import { LocateFixed } from 'lucide-react'

/**
 * @param {{ onClick: () => void }} props
 */
export default function MyLocationButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pointer-events-auto absolute bottom-24 right-3 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-slate-200"
      aria-label="현재 위치로 이동"
    >
      <LocateFixed className="h-6 w-6 text-slate-700" />
    </button>
  )
}
