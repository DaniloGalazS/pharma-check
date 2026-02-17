/**
 * PRO-61: Data normalization pipeline
 *
 * Unifies medication names, presentations, and laboratory names across
 * all data sources (MINSAL, Cruz Verde, Salcobrand, Ahumada, Dr. Simi).
 * Uses fuzzy matching for deduplication.
 */

// ---------------------------------------------------------------------------
// String normalization helpers
// ---------------------------------------------------------------------------

/** Remove diacritics and lowercase */
export function normalizeStr(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Normalize laboratory name to canonical form */
export function normalizeLaboratory(name: string): string {
  const lab = normalizeStr(name)

  const aliases: Record<string, string> = {
    'laboratorio chile': 'Lab. Chile',
    'lab chile': 'Lab. Chile',
    'laboratorios chile': 'Lab. Chile',
    'mintlab': 'Mintlab',
    'mintlab co': 'Mintlab',
    'pfizer': 'Pfizer',
    'bayer': 'Bayer',
    'novartis': 'Novartis',
    'roche': 'Roche',
    'abbott': 'Abbott',
    'bagó': 'Bagó',
    'bago': 'Bagó',
    'saval': 'Saval',
    'recalcine': 'Recalcine',
    'maver': 'Maver',
    'genfarma': 'Genfarma',
  }

  for (const [key, canonical] of Object.entries(aliases)) {
    if (lab.includes(key)) return canonical
  }

  // Title-case fallback
  return name
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

/** Normalize presentation type */
export function normalizePresentation(p: string): string {
  const n = normalizeStr(p)
  const map: Record<string, string> = {
    comp: 'Comprimido',
    comprimido: 'Comprimido',
    comprimidos: 'Comprimido',
    cap: 'Cápsula',
    capsula: 'Cápsula',
    cápsulas: 'Cápsula',
    capsulas: 'Cápsula',
    jar: 'Jarabe',
    jarabe: 'Jarabe',
    sol: 'Solución',
    solucion: 'Solución',
    solución: 'Solución',
    susp: 'Suspensión',
    suspension: 'Suspensión',
    suspensión: 'Suspensión',
    amp: 'Ampolla',
    ampolla: 'Ampolla',
    ampoules: 'Ampolla',
    crema: 'Crema',
    gel: 'Gel',
    gotas: 'Gotas',
    parche: 'Parche',
    inyectable: 'Inyectable',
    sobre: 'Sobre',
    ovulo: 'Óvulo',
    óvulo: 'Óvulo',
    supositorio: 'Supositorio',
    spray: 'Spray',
    aerosol: 'Aerosol',
  }

  for (const [key, canonical] of Object.entries(map)) {
    if (n.startsWith(key)) return canonical
  }
  return p
}

// ---------------------------------------------------------------------------
// Fuzzy matching / deduplication
// ---------------------------------------------------------------------------

/** Levenshtein distance for fuzzy matching */
function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (__, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

/** Similarity score 0–1 between two strings */
export function similarity(a: string, b: string): number {
  const na = normalizeStr(a)
  const nb = normalizeStr(b)
  if (na === nb) return 1
  const dist = levenshtein(na, nb)
  const maxLen = Math.max(na.length, nb.length)
  return maxLen === 0 ? 1 : 1 - dist / maxLen
}

/** Returns true if two medication names likely refer to the same product */
export function isSameMedication(
  a: { name: string; concentration?: string; presentation?: string },
  b: { name: string; concentration?: string; presentation?: string },
  threshold = 0.82
): boolean {
  const nameSim = similarity(a.name, b.name)
  if (nameSim < threshold) return false

  // If both have concentration, they must match closely
  if (a.concentration && b.concentration) {
    const concSim = similarity(a.concentration, b.concentration)
    if (concSim < 0.8) return false
  }

  // If both have presentation, prefer matching
  if (a.presentation && b.presentation) {
    const presSim = similarity(
      normalizePresentation(a.presentation),
      normalizePresentation(b.presentation)
    )
    if (presSim < 0.75) return false
  }

  return true
}

// ---------------------------------------------------------------------------
// Price / product normalization for DB upsert
// ---------------------------------------------------------------------------

export interface NormalizedMedication {
  genericName: string
  commercialName: string | null
  activePrinciple: string | null
  laboratory: string | null
  concentration: string | null
  presentation: string | null
  quantity: string | null
  ean: string | null
}

/** Normalize a raw scraped product name into a structured medication */
export function normalizeMedication(raw: {
  productName: string
  activePrinciple?: string
  laboratory?: string
  concentration?: string
  presentation?: string
  quantity?: string
  ean?: string
}): NormalizedMedication {
  return {
    genericName: raw.activePrinciple
      ? normalizeStr(raw.activePrinciple)
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
      : raw.productName,
    commercialName: raw.productName ?? null,
    activePrinciple: raw.activePrinciple ?? null,
    laboratory: raw.laboratory ? normalizeLaboratory(raw.laboratory) : null,
    concentration: raw.concentration ?? null,
    presentation: raw.presentation ? normalizePresentation(raw.presentation) : null,
    quantity: raw.quantity ?? null,
    ean: raw.ean ?? null,
  }
}

/** Parse CLP price string like "$1.290" → 1290 */
export function parsePrice(raw: string | number): number | null {
  if (typeof raw === 'number') return raw
  const cleaned = raw.replace(/[^\d,.-]/g, '').replace(',', '.')
  const val = parseFloat(cleaned)
  return isNaN(val) ? null : Math.round(val)
}
