import { MapShell } from "@/components/features/shell/map-shell"

type MapSearchParams = Promise<{ q?: string | string[] }>

export default async function MapPage({
  searchParams,
}: {
  searchParams: MapSearchParams
}) {
  const sp = await searchParams
  const raw = sp.q
  const bootstrapSearchQuery =
    typeof raw === "string"
      ? raw
      : Array.isArray(raw) && typeof raw[0] === "string"
        ? raw[0]
        : null

  return (
    <div className="h-full min-h-0">
      <MapShell bootstrapSearchQuery={bootstrapSearchQuery} />
    </div>
  )
}
