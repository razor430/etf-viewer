/**
 * Datos de rendimiento mensual histórico para el gráfico de estacionalidad.
 *
 * Cada ETF tiene una serie por año (2021-2026) con el retorno acumulado
 * mes a mes dentro de cada año. Los datos se generan sintéticamente a
 * partir de las métricas conocidas del ETF (YTD, return1y, return5y)
 * para mantener coherencia con el resto de la información mostrada.
 */

import type { Etf } from '@/types/etf'

/** Un punto semanal en el gráfico de estacionalidad. */
export interface WeeklyPoint {
  /** Semana 1-48 (4 semanas × 12 meses) */
  week: number
  /** Retorno acumulado en el año hasta esta semana (%) */
  value: number
}

/** Serie completa de un año. */
export interface YearSeries {
  year: number
  /** 48 puntos, uno por semana */
  data: WeeklyPoint[]
}

/**
 * Genera una trayectoria de 48 semanas con fluctuaciones realistas.
 *
 * Cada semana genera un retorno independiente (media = retorno anual / 48)
 * más un componente de ruido proporcional a la volatilidad del sector.
 * El ruido puede hacer que semanas individuales sean negativas incluso
 * en años positivos, y viceversa. Al final se escala para que el retorno
 * anual acumulado coincida exactamente con el valor esperado.
 */
function generateYearlyPath(
  annualReturn: number,
  volatility: number,
  seedOffset: number,
): number[] {
  const WEEKS = 48
  const avgWeeklyReturn = annualReturn / WEEKS
  const weeklyReturns: number[] = []

  for (let w = 0; w < WEEKS; w++) {
    // Ruido semanal: [-0.5, 0.5] escalado por volatilidad
    const noise = simpleNoise(seedOffset + w)
    const weeklyReturn = avgWeeklyReturn + noise * volatility * 2.0
    weeklyReturns.push(weeklyReturn)
  }

  // Acumular para obtener el rendimiento acumulado
  const path: number[] = []
  let cum = 0
  for (let w = 0; w < WEEKS; w++) {
    cum += weeklyReturns[w]
    path.push(cum)
  }

  // Ajuste final para que el retorno anual coincida exactamente
  const actualAnnual = path[WEEKS - 1]
  const scale = annualReturn / (actualAnnual || 0.01)
  return path.map((v) => +(v * scale).toFixed(2))
}

/** Ruido pseudoaleatorio simple y determinístico. */
export function simpleNoise(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x) - 0.5
}

/** Determina la volatilidad aproximada según el sector. */
export function sectorVolatility(sector: string): number {
  const map: Record<string, number> = {
    Technology: 1.6,
    'Health Care': 0.9,
    Financials: 1.3,
    Energy: 1.8,
    'Consumer Discretionary': 1.4,
    'Consumer Staples': 0.7,
    Industrials: 1.2,
    Materials: 1.5,
    Utilities: 0.6,
    'Real Estate': 1.0,
    'Communication Services': 1.5,
    'Emerging Markets': 1.7,
    'Developed Markets': 1.0,
    Commodities: 2.0,
    'Fixed Income': 0.4,
    Thematic: 1.8,
    'Broad Market': 1.0,
  }
  return map[sector] ?? 1.2
}

/**
 * Retorna las series mensuales para los 6 años (2021-2026) de un ETF.
 *
 * Usa el retorno a 5 años para calibrar 2021-2024, el retorno a 1 año
 * para 2025, y el YTD para 2026 (el año en curso).
 */
export function getMonthlySeries(etf: Etf): YearSeries[] {
  const vol = sectorVolatility(etf.sector)
  const idHash = etf.ticker.charCodeAt(0) + etf.ticker.length * 42

  const years: YearSeries[] = []

  // Si el ETF tiene retornos reales por año, los usamos; si no, sintéticos
  const hasRealReturns = etf.yearlyReturns != null

  // 2021-2025
  for (let year = 2021; year <= 2025; year++) {
    let annualReturn: number

    if (hasRealReturns) {
      // Usar el dato real si existe, sino calcular sintético
      annualReturn = etf.yearlyReturns![year] ?? syntheticYearlyReturn(etf, year, idHash)
    } else {
      annualReturn = syntheticYearlyReturn(etf, year, idHash)
    }

    const path = generateYearlyPath(annualReturn, vol, idHash + year * 100)
    years.push({
      year,
      data: path.map((v, w) => ({ week: w + 1, value: v })),
    })
  }

  // 2026 (año en curso, basado en YTD; asumimos vamos por junio)
  const ytd = etf.ytd
  const projectedAnnual = ytd * 2 // anualizar: YTD * 12/6
  const pathYtd = generateYearlyPath(projectedAnnual, vol, idHash + 2026 * 100)
  // Solo mostramos las primeras 28 semanas (Ene-Jul)
  years.push({
    year: 2026,
    data: pathYtd.slice(0, 28).map((v, w) => ({ week: w + 1, value: v })),
  })

  return years.sort((a, b) => a.year - b.year)
}

/**
 * Calcula un retorno anual sintético para un año que no tenga dato real.
 * Distribuye el retorno a 5 años entre 2021-2024 y usa return1y para 2025.
 */
export function syntheticYearlyReturn(etf: Etf, year: number, idHash: number): number {
  if (year === 2025) {
    return etf.return1y
  }
  // 2021-2024: distribuir return5y
  const yearlyReturns5 = distribute5yReturn(etf.return5y, idHash)
  const idx = year - 2021
  return yearlyReturns5[idx] ?? 0
}
/** Descompone el retorno a 5 años en 4 años individuales. */
function distribute5yReturn(totalReturn: number, seed: number): number[] {
  // Perfiles típicos de cómo se distribuye un retorno a 5 años
  // Cada perfil tiene 4 ponderaciones que suman 1
  const profiles: number[][] = [
    [0.15, 0.25, 0.35, 0.25], // crecimiento acelerado
    [0.30, 0.30, 0.20, 0.20], // más fuerte al inicio
    [0.20, 0.20, 0.30, 0.30], // más fuerte al final
    [0.25, 0.25, 0.25, 0.25], // uniforme
    [0.10, 0.20, 0.30, 0.40], // aceleración fuerte
  ]

  // simpleNoise devuelve [-0.5, 0.5]; desplazamos a [0, 1) para índice siempre positivo
  const idx = Math.floor((simpleNoise(seed + 999) + 0.5) * profiles.length) % profiles.length
  const profile = profiles[idx]
  const totalBase = profile.reduce((a, b) => a + b, 0)

  return profile.map((w) => +(totalReturn * (w / totalBase)).toFixed(1))
}

/** Etiquetas de meses en español. */
export const MONTH_LABELS: Record<number, string> = {
  1: 'Ene',
  2: 'Feb',
  3: 'Mar',
  4: 'Abr',
  5: 'May',
  6: 'Jun',
  7: 'Jul',
  8: 'Ago',
  9: 'Sep',
  10: 'Oct',
  11: 'Nov',
  12: 'Dic',
}

/** Convierte semana (1-48) al mes correspondiente (1-12). */
export function weekToMonth(week: number): number {
  return Math.ceil(week / 4)
}