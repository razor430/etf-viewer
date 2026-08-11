/**
 * Categorías de sector soportadas por el explorador.
 * El canalón "Broad Market" agrupa ETFs de mercado amplio (VOO, QQQ, SCHD...).
 */
export type SectorCategory =
  | 'Technology'
  | 'Health Care'
  | 'Financials'
  | 'Energy'
  | 'Consumer Discretionary'
  | 'Consumer Staples'
  | 'Industrials'
  | 'Materials'
  | 'Utilities'
  | 'Real Estate'
  | 'Communication Services'
  | 'Emerging Markets'
  | 'Developed Markets'
  | 'Commodities'
  | 'Fixed Income'
  | 'Thematic'
  | 'Broad Market'

/** Alias de conveniencia para el filtro "todos". */
export type SectorFilter = SectorCategory | 'All'

/**
 * Clasificación de alto nivel del universo de ETFs.
 * - `indices`: ETF que replican índices (SPY, VOO, QQQ, países, etc.)
 * - `sectores`: ETF sectoriales del S&P 500 (serie XL*).
 * - `commodities`: exposición a materias primas (oro, petróleo, etc.)
 * - `renta-fija`: bonos y deuda (tesorería, corporativos, high yield).
 */
export type EtfCategory = 'indices' | 'sectores' | 'commodities' | 'renta-fija'

/** Alias para el filtro de categoría (incluye "Todos"). */
export type CategoryFilter = EtfCategory | 'All'

/** Posición individual dentro de la cartera de un ETF. */
export interface Holding {
  /** Nombre de la empresa / activo subyacente. */
  name: string
  /** Ticker de la empresa (ej: AAPL). */
  ticker: string
  /** Ponderación porcentual en la cartera del ETF. */
  weight: number
  /** Sector al que pertenece la posición. */
  sector: string
}

/** Modelo de dominio para un ETF. */
export interface Etf {
  /** Identificador estable (ticker). */
  id: string
  ticker: string
  name: string
  description: string
  /** Clasificación de alto nivel (índices / sectores / commodities / renta fija). */
  category: EtfCategory
  /** Sector específico (p.ej. Technology para los XL). */
  sector: SectorCategory
  /** Activos bajo gestión (AUM) en USD. */
  aum: number
  /** Ratio de gastos (expense ratio) en porcentaje. */
  expenseRatio: number
  /** Último precio de mercado. */
  price: number
  /** Rendimiento año a la fecha (%) */
  ytd: number
  /** Rendimiento a 1 año (%). */
  return1y: number
  /** Rendimiento a 5 años (%). */
  return5y: number
  /** Dividend yield (%) */
  dividendYield: number
  /** P/E promedio ponderado. */
  peRatio: number
  /** Beta a 1 año. */
  beta: number
  /** Total de posiciones del ETF. */
  holdingsCount: number
  /** Top-20 holdings (ponderación). */
  topHoldings: Holding[]
  /** Fecha de referencia de los datos. */
  dataAsOf: string
}