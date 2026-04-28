import { haversineMeters, formatDistanceMeters } from "@/lib/distance"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

/**
 * @param {{
 *   store: import('../types/store.js').Store | null
 *   distanceOrigin: { lat: number, lng: number }
 *   onClose: () => void
 *   onReport: (status: 'FULL' | 'FEW' | 'EMPTY') => void | Promise<void>
 * }} props
 */
export default function StoreBottomSheet({
  store,
  distanceOrigin,
  onClose,
  onReport,
}) {
  /** 모달은 즉시 닫고, 제보·서버 반영은 부모에서 비동기 처리 */
  const onReportClick = (status) => {
    onClose()
    void onReport(status)
  }

  const open = store != null
  const dist =
    store != null
      ? formatDistanceMeters(
          haversineMeters(distanceOrigin, {
            lat: store.lat,
            lng: store.lng,
          }),
        )
      : ""

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="bottom"
        showCloseButton
        className="max-h-[85vh] gap-0 overflow-y-auto rounded-t-2xl border-t p-0"
      >
        {store && (
          <>
            <SheetHeader className="border-border border-b px-4 py-4 text-left">
              <SheetTitle className="pr-10">{store.storeName}</SheetTitle>
              <SheetDescription>
                지도 기준 약 {dist} · 마지막 반영{" "}
                {store.updatedAt.slice(0, 16).replace("T", " ")}
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-4 px-4 py-4">
              <p className="text-sm text-foreground">{store.address || "주소 없음"}</p>
              {store.phone ? (
                <a
                  href={`tel:${store.phone.replace(/\s/g, "")}`}
                  className="text-primary text-sm font-medium underline-offset-4 hover:underline"
                >
                  {store.phone}
                </a>
              ) : (
                <p className="text-muted-foreground text-sm">전화번호 없음</p>
              )}
              <div>
                <p className="text-muted-foreground mb-1.5 text-xs font-medium">
                  취급 봉투
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {store.bagTypes.length === 0 ? (
                    <span className="text-muted-foreground text-sm">데이터 없음</span>
                  ) : (
                    store.bagTypes.map((t) => (
                      <Badge key={t} variant="secondary">
                        {t}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground mb-2 text-xs font-medium">
                  재고 제보
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    className="bg-emerald-600 text-white hover:bg-emerald-600/90"
                    onClick={() => onReportClick("FULL")}
                  >
                    재고 있음
                  </Button>
                  <Button
                    type="button"
                    className="bg-amber-500 text-white hover:bg-amber-500/90"
                    onClick={() => onReportClick("FEW")}
                  >
                    소량 남음
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => onReportClick("EMPTY")}
                  >
                    품절
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
