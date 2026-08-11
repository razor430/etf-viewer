import { mockEtfs } from '@/data/mockEtfs'
import type { CategoryFilter, Etf } from '@/types/etf'

/**
 * Capa de datos de la aplicación.
 *
 * Todos los métodos retornan Promesas (`async/await`) simulando latencia de red.
 * Para conectar una API real (Yahoo Finance, Financial Modeling Prep, etc.)
 * basta con reimplementar estas funciones manteniendo la misma firma.
 */

/** Latencia artificial para simular una llamada de red. */
const NETWORK_DELAY_MS = 350

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retorna todos los ETFs disponibles (simula GET /etfs).
 */
export async function fetchEtfs(): Promise<Etf[]> {
  await delay(NETWORK_DELAY_MS)
  return mockEtfs.map((etf) => ({ ...etf, topHoldings: [...etf.topHoldings] }))
}

/**
 * Retorna el detalle de un ETF por ticker (simula GET /etfs/:ticker).
 * Lanza un error si no existe.
 */
export async function getEtfByTicker(ticker: string): Promise<Etf> {
  await delay(NETWORK_DELAY_MS)
  const normalized = ticker.trim().toUpperCase()
  const etf = mockEtfs.find((item) => item.ticker === normalized)
  if (!etf) {
    throw new Error(`No se encontró el ETF "${ticker}".`)
  }
  return { ...etf, topHoldings: [...etf.topHoldings] }
}

/**
 * Búsqueda de ETFs por ticker o nombre (case-insensitive).
 * Simula GET /etfs/search?q=...
 */
export async function searchEtfs(query: string): Promise<Etf[]> {
  await delay(NETWORK_DELAY_MS)
  const q = query.trim().toLowerCase()
  if (!q) {
    return mockEtfs.map((etf) => ({ ...etf, topHoldings: [...etf.topHoldings] }))
  }
  return mockEtfs
    .filter(
      (etf) =>
        etf.ticker.toLowerCase().includes(q) ||
        etf.name.toLowerCase().includes(q) ||
        etf.description.toLowerCase().includes(q),
    )
    .map((etf) => ({ ...etf, topHoldings: [...etf.topHoldings] }))
}

/**
 * Combina filtro por categoría y búsqueda en un único query de alto nivel.
 * Es la función que usa la capa de presentación.
 */
export async function queryEtfs(params: {
  category: CategoryFilter
  search: string
}): Promise<Etf[]> {
  await delay(NETWORK_DELAY_MS)
  const { category, search } = params
  const q = search.trim().toLowerCase()

  return mockEtfs
    .filter((etf) => (category === 'All' ? true : etf.category === category))
    .filter((etf) =>
      q
        ? etf.ticker.toLowerCase().includes(q) ||
          etf.name.toLowerCase().includes(q) ||
          etf.description.toLowerCase().includes(q)
        : true,
    )
    .map((etf) => ({ ...etf, topHoldings: [...etf.topHoldings] }))
}