import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"
import { createClient } from "@supabase/supabase-js"
import { parseStoresStandardJson } from "../src/lib/parseStoresStandardJson.js"
import { storeToStoresTableRow } from "../src/lib/storeToDbRow.js"

function loadDotEnv() {
  const p = resolve(process.cwd(), ".env")
  if (!existsSync(p)) return
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const k = trimmed.slice(0, eq).trim()
    let v = trimmed.slice(eq + 1).trim()
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1)
    }
    if (k && process.env[k] === undefined) process.env[k] = v
  }
}

loadDotEnv()

const DEFAULT_JSON = resolve(
  process.cwd(),
  "public/전국종량제봉투판매소표준데이터.json",
)

const jsonPathArg = process.argv[2]
const jsonPath = jsonPathArg
  ? resolve(process.cwd(), jsonPathArg)
  : DEFAULT_JSON

const url =
  process.env.SUPABASE_URL?.trim() ||
  process.env.VITE_SUPABASE_URL?.trim() ||
  ""
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || ""

if (!url || !serviceKey) {
  console.error(
    "대량 적재에 필요한 값:\n" +
      "  · Project URL → VITE_SUPABASE_URL (또는 Node 전용 SUPABASE_URL) 중 하나\n" +
      "  · SUPABASE_SERVICE_ROLE_KEY (대시보드 API의 service_role, 로컬·스크립트 전용)\n" +
      "프론트용 VITE_SUPABASE_ANON_KEY 로는 RLS 때문에 upsert 할 수 없습니다.\n" +
      "service_role 은 Git/프론트(VITE_*)에 넣지 마세요.",
  )
  process.exit(1)
}

if (!existsSync(jsonPath)) {
  console.error("JSON 파일을 찾을 수 없습니다:", jsonPath)
  process.exit(1)
}

const BATCH = 500

/** 동일 id가 한 배치에 두 번 나오면 Postgres upsert 가 21000 으로 실패하므로 id 기준 병합(마지막 행 유지) */
function dedupeRowsById(rows) {
  const map = new Map()
  for (const r of rows) {
    map.set(r.id, r)
  }
  return Array.from(map.values())
}

console.log("읽는 중:", jsonPath)
const raw = JSON.parse(readFileSync(jsonPath, "utf8"))
const { stores, errors } = parseStoresStandardJson(raw)

for (const err of errors) {
  console.warn("[parse]", err)
}

if (stores.length === 0) {
  console.error("적재할 판매소가 없습니다.")
  process.exit(1)
}

const rowsRaw = stores.map(storeToStoresTableRow)
const rows = dedupeRowsById(rowsRaw)
const dupCount = rowsRaw.length - rows.length
if (dupCount > 0) {
  console.warn(
    `동일 id(UUID) 중복 ${dupCount}건 병합 → 고유 ${rows.length}건 (소스에 완전 동일 행이 중복된 경우)`,
  )
}

const supabase = createClient(url, serviceKey)

console.log(`총 ${rows.length}건 upsert (배치 ${BATCH})…`)

for (let i = 0; i < rows.length; i += BATCH) {
  const chunk = rows.slice(i, i + BATCH)
  const { error } = await supabase.from("stores").upsert(chunk, {
    onConflict: "id",
  })
  if (error) {
    console.error(
      `배치 실패 (오프셋 ${i}~${i + chunk.length - 1}):`,
      error.message,
      error,
    )
    process.exit(1)
  }
  const done = Math.min(i + BATCH, rows.length)
  console.log(`  ${done} / ${rows.length}`)
}

console.log("완료.")
