const STORAGE_KEY = 'env-check.country-history.v1'
const MAX_ENTRIES = 10
const WINDOW_MS = 7 * 24 * 60 * 60 * 1000 // 近 7 天窗口

interface HistoryEntry {
  countryCode: string
  timestamp: number
}

function readHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

function writeHistory(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)))
  } catch {
    /* localStorage 不可用时静默忽略，不影响主流程 */
  }
}

/**
 * 记录本次检测到的国家代码，并返回近 7 天内出现过的「不同国家」数量。
 * 仅在本机浏览器本地留存，不上传、不跨设备统计。
 */
export function recordAndCountCountrySwitches(countryCode: string): number {
  if (!countryCode) return 1

  const now = Date.now()
  const history = readHistory().filter((e) => now - e.timestamp <= WINDOW_MS)

  history.push({ countryCode, timestamp: now })
  writeHistory(history)

  const distinct = new Set(history.map((e) => e.countryCode))
  return distinct.size
}

export function clearCountryHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* noop */
  }
}
