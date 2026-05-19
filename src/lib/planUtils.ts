export function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function getSeasonYear(date: Date): number {
  return date.getMonth() >= 4 ? date.getFullYear() : date.getFullYear() - 1
}

export function seasonLabel(seasonYear: number): string {
  return `${String(seasonYear).slice(-2)}/${String(seasonYear + 1).slice(-2)}`
}

// 'YYYY-MM-DD' → 'dd/mm/yyyy'
export function fmtDateDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

// Date object → 'dd/mm/yyyy'
export function fmtDateObj(date: Date): string {
  return fmtDateDisplay(toDateStr(date))
}
