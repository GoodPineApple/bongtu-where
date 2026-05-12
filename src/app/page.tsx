import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-8 px-4 py-16 text-center">
      <div className="max-w-md space-y-3">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          종량제 봉투 · 지도·커뮤니티
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          봉투어디
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          가까운 판매처와 재고 제보는 지도에서, 생활 정보는 익명 게시판에서 확인하세요.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/map">지도 열기</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/community">커뮤니티</Link>
        </Button>
      </div>
    </div>
  )
}
