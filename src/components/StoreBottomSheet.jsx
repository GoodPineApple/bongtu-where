import { haversineMeters, formatDistanceMeters } from '../lib/distance'
import { X } from 'lucide-react'

/**
 * @param {{
 *   store: import('../types/store.js').Store | null
 *   userPosition: { lat: number, lng: number }
 *   onClose: () => void
 *   onReport: (status: 'FULL' | 'FEW' | 'EMPTY') => void
 * }} props
 */
export default function StoreBottomSheet({ store, userPosition, onClose, onReport }) {
  const open = store != null

  const dist =
    store != null
      ? formatDistanceMeters(haversineMeters(userPosition, { lat: store.lat, lng: store.lng }))
      : ''

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-black/30 transition-opacity"
          onClick={onClose}
          aria-label="닫기"
        />
      )}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 max-h-[70vh] rounded-t-2xl bg-white shadow-[0_-4px_24px_rgba(0,0,0,.12)] transition-transform duration-300 ease-out ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={open ? 'sheet-title' : undefined}
      >
        {store && (
          <div className="flex max-h-[70vh] flex-col overflow-hidden">
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-4 pb-3 pt-4">
              <div className="min-w-0">
                <h2 id="sheet-title" className="text-lg font-semibold text-slate-900">
                  {store.storeName}
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">{dist} · 마지막 반영 {store.updatedAt.slice(0, 16).replace('T', ' ')}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-full p-2 text-slate-500 hover:bg-slate-100"
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <p className="text-sm text-slate-700">{store.address || '주소 없음'}</p>
              {store.phone ? (
                <a
                  href={`tel:${store.phone.replace(/\s/g, '')}`}
                  className="mt-2 inline-block text-sm font-medium text-blue-600"
                >
                  {store.phone}
                </a>
              ) : (
                <p className="mt-2 text-sm text-slate-400">전화번호 없음</p>
              )}
              <div className="mt-4">
                <p className="text-xs font-medium text-slate-500">취급 봉투</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {store.bagTypes.length === 0 ? (
                    <span className="text-sm text-slate-400">데이터 없음</span>
                  ) : (
                    store.bagTypes.map((t) => (
                      <span
                        key={t}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                      >
                        {t}
                      </span>
                    ))
                  )}
                </div>
              </div>
              <div className="mt-6 border-t border-slate-100 pt-4">
                <p className="text-xs font-medium text-slate-500">재고 제보 (시뮬레이션)</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white"
                    onClick={() => onReport('FULL')}
                  >
                    재고 있음
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white"
                    onClick={() => onReport('FEW')}
                  >
                    소량 남음
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white"
                    onClick={() => onReport('EMPTY')}
                  >
                    품절
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
