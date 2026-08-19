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
  /** Variación porcentual del día actual. */
  dayChange: number
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
  /**
   * Día ordinal del año (1-365, con Feb=28 días) en que el ETF empezó a cotizar,
   * para ETF listados a mitad de año (ej: DRAM, 2026-04-02 → día 92).
   * Si está seteado, la serie del año en curso arranca en ese día en lugar
   * del 1 de enero (los días previos no se dibujan porque el ETF no existía).
   */
  inceptionDay?: number
  /**
   * Serie diaria real del año en curso: pares [día ordinal (MM-DD, Feb=28 días),
   * retorno acumulado YTD %. P0 = cierre del primer día hábil del año].
   * Cuando está presente, el gráfico estacional del año en curso dibuja la
   * trayectoria real (dips y picos, ej: IGPT negativo en marzo-abril y pico de
   * +77% en junio 2026) en lugar de la línea sintética derivada de `ytd`.
   * Debe venir ordenada de forma ascendente por día.
   */
  currentYearDaily?: Array<[number, number]>
  /**
   * Rendimientos reales por año calendario (2021-2025).
   * `null` en un año significa que el ETF todavía no cotizaba (ej: listado
   * posterior) y el gráfico no dibuja la línea de ese año.
   * Si no se proporciona ningún dato real, se calculan sintéticamente desde return5y.
   */
  yearlyReturns?: Record<number, number | null> | null
}