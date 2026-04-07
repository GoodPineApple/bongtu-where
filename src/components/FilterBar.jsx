import { Search } from 'lucide-react'

/**
 * @param {{
 *   searchQuery: string
 *   onSearchChange: (q: string) => void
 *   bagFilter: string | null
 *   onBagFilterChange: (v: string | null) => void
 *   bagOptions: string[]
 * }} props
 */
export default function FilterBar({
  searchQuery,
  onSearchChange,
  bagFilter,
  onBagFilterChange,
  bagOptions,
}) {
  return (
    <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 flex flex-col gap-2 p-3">
      <div className="pointer-events-auto flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 shadow-md ring-1 ring-slate-200">
        <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="판매소명·주소 검색"
          className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
          autoComplete="off"
        />
      </div>
      <div className="pointer-events-auto flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onBagFilterChange(null)}
          className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${
            bagFilter == null
              ? 'bg-slate-800 text-white ring-slate-800'
              : 'bg-white/95 text-slate-700 ring-slate-200'
          }`}
        >
          전체
        </button>
        {bagOptions.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onBagFilterChange(opt)}
            className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${
              bagFilter === opt
                ? 'bg-slate-800 text-white ring-slate-800'
                : 'bg-white/95 text-slate-700 ring-slate-200'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}
