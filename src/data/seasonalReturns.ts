/**
 * Datos de rendimiento estacional (diario) para el gráfico de estacionalidad.
 *
 * A diferencia del histórico semanal sintético de monthlyReturns, aquí se genera
 * una trayectoria DIARIA (una por año, 2021-2026) a partir del "cierre ajustado":
 *   - X se normaliza al "día del año" (formato MM-DD, Feb tratado como 28 días)
 *     para alinear todos los años horizontalmente.
 *   - Y se normaliza tomando P0 = cierre del primer día hábil del año y calculando
 *     para cada día t:  Rendimiento = ((P_t / P0) - 1) * 100.
 *   - El promedio histórico se calcula en el componente como la media aritmética
 *     de los rendimientos de todos los años seleccionados por cada día del año.
 *
 * Los precios diarios se sintetizan desde las métricas conocidas del ETF
 * (YTD, return1y, return5y / yearlyReturns) para mantener coherencia con el
 * resto de la información, igual que el resto del dataset offline.
 */

import type { Etf } from '@/types/etf'
import { MONTH_LABELS, sectorVolatility, simpleNoise, syntheticYearlyReturn } from '@/data/monthlyReturns'

/** Un punto diario en el gráfico de estacionalidad. */
export interface SeasonalPoint {
  /** Coordenada X: día del año en formato MM-DD (Feb → 28 días) para alinear años. */
  day: number
  /** Retorno acumulado en el año hasta este día (%) = (P_t / P0 - 1) * 100. */
  value: number
}

/** Serie completa de un año. */
export interface SeasonalYearSeries {
  year: number
  /** Puntos por cada día calendario desde el día 1 (fines de semana rellenados con el último cierre). */
  data: SeasonalPoint[]
}

export { MONTH_LABELS }

/** Año en curso (parcial, hasta la fecha actual). */
const CURRENT_YEAR = 2026

/** Días hacia atrás respecto a la fecha real: evita usar días aún no publicados por el mercado. */
const CURRENT_YEAR_END_LAG_DAYS = 7

/** Fecha límite para el año en curso = hoy menos un margen, sin salir del año en curso. */
function endOfCurrentSeries(): Date {
  const end = new Date()
  end.setDate(end.getDate() - CURRENT_YEAR_END_LAG_DAYS)
  if (end.getFullYear() > CURRENT_YEAR) return new Date(CURRENT_YEAR, 11, 31)
  if (end.getFullYear() < CURRENT_YEAR) return new Date(CURRENT_YEAR, 0, 1)
  return end
}

/** Semana de trading asumida: Lun-Vie. */
const WEEKEND = new Set([0, 6])

/**
 * Primer día ordinal de cada mes (año con Feb de 28 días) para alinear todos
 * los años por formato MM-DD. day=1 ⇒ 1-Ene, day=32 ⇒ 1-Feb, etc.
 */
export const MONTH_START_DAYS: number[] = [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335]

/** Convierte (mes, día) a día ordinal ignorando el 29-feb => alineación MM-DD. */
function dayOrdinal(month: number, day: number): number {
  const acc = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
  return acc[month - 1] + day
}

/**
 * Genera la trayectoria diaria de retorno acumulado con un "puente browniano".
 *
 * Sobre un camino aleatorio continuo (ruido diario acumulado, de escala proporcional
 * a la volatilidad del sector, como el histórico que se venía usando) se restan
 * la deriva del extremo para "anclarlo": empieza en 0 y termina exactamente en el
 * retorno anual del año. Así la curva es natural y realista (con dips y
 * recuperaciones) pero sin drawdowns irrealistas tipo -80% ni giros exagerados.
 */
function buildDailyPath(
  targetReturn: number,
  nTrades: number,
  volatility: number,
  seedOffset: number,
): number[] {
  if (nTrades <= 0) return []
  if (nTrades === 1) return [+targetReturn.toFixed(2)]

  // Camino aleatorio acumulado (sin deriva). La amplitud del ruido escala con la
  // volatilidad del sector; el puente lo mantiene en un rango realista.
  const noiseAmp = volatility * 1.6
  const raw: number[] = []
  let w = 0
  for (let i = 0; i < nTrades; i++) {
    w += simpleNoise(seedOffset + i) * noiseAmp * 2.0
    raw.push(w)
  }
  const endRaw = raw[nTrades - 1]

  const path: number[] = []
  for (let i = 0; i < nTrades; i++) {
    const frac = nTrades === 1 ? 1 : i / (nTrades - 1)
    const drift = targetReturn * frac
    const bridge = raw[i] - frac * endRaw
    path.push(+(drift + bridge).toFixed(2))
  }

  // Extremo exacto = retorno anual.
  path[nTrades - 1] = +targetReturn.toFixed(2)
  return path
}

/** Rellena el año (día 1..último) arrastrando el último cierre para los días sin rueda. */
function fillCalendar(points: SeasonalPoint[]): SeasonalPoint[] {
  if (points.length === 0) return []
  const lastDay = points[points.length - 1].day
  const byDay = new Map(points.map((p) => [p.day, p.value]))
  const filled: SeasonalPoint[] = []
  let prev = 0
  for (let day = 1; day <= lastDay; day++) {
    const has = byDay.get(day)
    prev = has ?? prev
    filled.push({ day, value: prev })
  }
  return filled
}

/** Construye la serie de un año (o del año en curso hasta la fecha actual menos un margen). */
function buildYearSeries(etf: Etf, year: number, idHash: number): SeasonalPoint[] {
  const isCurrent = year === CURRENT_YEAR
  const vol = sectorVolatility(etf.sector)

  let targetReturn: number
  let end: Date
  if (isCurrent) {
    targetReturn = etf.ytd
    end = endOfCurrentSeries()
  } else {
    targetReturn = etf.yearlyReturns?.[year] ?? syntheticYearlyReturn(etf, year, idHash)
    end = new Date(year, 11, 31)
  }

  const start = new Date(year, 0, 1)
  const ordinals: number[] = []
  for (const dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
    if (!WEEKEND.has(dt.getDay())) {
      ordinals.push(dayOrdinal(dt.getMonth() + 1, dt.getDate()))
    }
  }

  const path = buildDailyPath(targetReturn, ordinals.length, vol, idHash + year * 100)
  const trades: SeasonalPoint[] = ordinals.map((ordinal, i) => ({ day: ordinal, value: path[i] }))
  return fillCalendar(trades)
}

/**
 * Retorna las series diarias (2021-2026) del rendimiento estacional de un ETF,
 * con P0 = cierre del primer día hábil y rendimiento acumulado en %.
 */
export function getSeasonalSeries(etf: Etf): SeasonalYearSeries[] {
  const idHash = etf.ticker.charCodeAt(0) + etf.ticker.length * 42
  const years = [2021, 2022, 2023, 2024, 2025, 2026]
  return years.map((year) => ({ year, data: buildYearSeries(etf, year, idHash) }))
}