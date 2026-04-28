"use client"

import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export type FilterBarProps = {
  searchQuery: string
  onSearchChange: (q: string) => void
  bagFilter: string | null
  onBagFilterChange: (v: string | null) => void
  bagOptions: string[]
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  bagFilter,
  onBagFilterChange,
  bagOptions,
}: FilterBarProps) {
  return (
    <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 flex flex-col gap-2 p-3">
      <div className="pointer-events-auto relative shadow-sm">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 z-10 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="판매소명·주소 검색"
          className="h-9 border-border/80 bg-card/95 pr-3 pl-9 shadow-sm backdrop-blur-sm"
          autoComplete="off"
        />
      </div>
      <div className="pointer-events-auto flex flex-wrap gap-1.5">
        <Button
          type="button"
          size="sm"
          variant={bagFilter == null ? "default" : "outline"}
          className="rounded-full"
          onClick={() => onBagFilterChange(null)}
        >
          전체
        </Button>
        {bagOptions.map((opt) => (
          <Button
            key={opt}
            type="button"
            size="sm"
            variant={bagFilter === opt ? "default" : "outline"}
            className="rounded-full"
            onClick={() => onBagFilterChange(opt)}
          >
            {opt}
          </Button>
        ))}
      </div>
    </div>
  )
}
