import { useMemo } from 'react'
import {
  CartesianGrid,
  Customized,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Etf } from '@/types/etf'
import {
  getSeasonalSeries,
  MONTH_LABELS,
  MONTH_START_DAYS,
} from '@/data/seasonalReturns'

export interface SeasonalReturnsChartProps {
  etf: Etf
}

const CURRENT_YEAR = 2026

const YEAR_COLORS: Record<number, string> = {
  2021: '#64748b',
  2022: '#94a3b8',
  2023: '#c084fc',
  2024: '#60a5fa',
  2025: '#34d399',
  2026: '#22d3ee',
}

/** Color del promedio histórico. */
const AVG_COLOR = '#f8fafc'

/** Estilo por línea: el año en curso más grueso; los anteriores sólidos pero más finos. */
function lineStyle(year: number) {
  if (year === CURRENT_YEAR) return { width: 2.5 }
  return { width: 1.25 }
}

function formatPct(v: number) {
  if (v === 0) return '0%'
  return `${v > 0 ? '+' : ''}${v.toFixed(0)}%`
}

/** Convierte un día ordinal (MM-DD) a la etiqueta del mes. */
function dayToMonth(day: number): number {
  let m = 0
  while (m < 11 && MONTH_START_DAYS[m + 1] <= day) m++
  return m + 1
}

function formatMonth(day: number): string {
  return MONTH_LABELS[dayToMonth(day)] ?? ''
}

/** Etiquetas de año (y promedio) al final de cada línea. */
function YearEndLabels(props: {
  data?: Record<string, unknown>[]
  width?: number
  height?: number
  offset?: { top: number; bottom: number; left: number; right: number }
}) {
  const { data, width, height, offset } = props
  if (!data?.length || !width || !height || !offset) return null

  const chartW = width - offset.left - offset.right
  const chartH = height - offset.top - offset.bottom

  let yMin = 0
  let yMax = 0
  const keys = Object.keys(data[0]).filter((k) => k !== 'day' && k !== 'avg' && k !== '_label')
  for (const row of data) {
    for (const y of keys) {
      const v = row[y] as number | null
      if (v == null) continue
      if (v < yMin) yMin = v
      if (v > yMax) yMax = v
    }
  }
  const yRange = Math.max(Math.abs(yMax - yMin), 1)

  let yBottom: number, yTop: number
  if (yMin >= 0) {
    yBottom = 0 - yRange * 0.1
    yTop = yMax + yRange * 0.15
  } else if (yMax <= 0) {
    yBottom = yMin - yRange * 0.15
    yTop = 0 + yRange * 0.1
  } else {
    yBottom = yMin - yRange * 0.55
    yTop = yMax + yRange * 0.15
  }

  const xPos = offset.left + chartW + 6

  return (
    <g>
      {keys.map((year) => {
        let lastVal: number | null = null
        for (let i = data.length - 1; i >= 0; i--) {
          const v = data[i][year] as number | null
          if (v != null) {
            lastVal = v
            break
          }
        }
        if (lastVal == null) return null

        const isCurrent = year === String(CURRENT_YEAR)
        const color = YEAR_COLORS[Number(year)] ?? '#64748b'
        const yPos = offset.top + chartH - ((lastVal - yBottom) / (yTop - yBottom)) * chartH

        return (
          <text
            key={year}
            x={xPos}
            y={yPos}
            fill={color}
            fontSize={isCurrent ? 12 : 11}
            fontWeight={isCurrent ? 600 : 400}
            textAnchor="start"
            dominantBaseline="middle"
          >
            {year}
          </text>
        )
      })}
    </g>
  )
}

/** Leyenda compacta con los colores y el promedio. */
function Legend() {
  const rows = Object.entries(YEAR_COLORS).map(([year, color]) => ({
    label: year,
    color,
    dash: '0',
    width: year === String(CURRENT_YEAR) ? 2.5 : 1.25,
  }))
  rows.push({ label: 'Promedio', color: AVG_COLOR, dash: '5 3', width: 2 })

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
      {rows.map((r) => (
        <span
          key={r.label}
          className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"
        >
          <svg width="16" height="8" aria-hidden="true">
            <line
              x1="0"
              y1="4"
              x2="16"
              y2="4"
              stroke={r.color}
              strokeWidth={r.width}
              strokeDasharray={r.dash}
            />
          </svg>
          {r.label}
        </span>
      ))}
    </div>
  )
}
/**
 * Gráfico de rendimiento estacional.
 *
 * Toma los cierres ajustados diarios de cada año (2021-2026) y los normaliza:
 *   - X → día del año (formato MM-DD) para alinear los años horizontalmente.
 *   - Y → rendimiento acumulado con P0 = cierre del primer día hábil:
 *         Rendimiento = ((P_t / P0) - 1) * 100.
 * Dibuja una línea por año + una línea punteada con el promedio aritmético por día.
 */
export function SeasonalReturnsChart({ etf }: SeasonalReturnsChartProps) {
  const series = useMemo(() => {
    try {
      return getSeasonalSeries(etf)
    } catch {
      return []
    }
  }, [etf])

  const chartData = useMemo(() => {
    if (series.length === 0) return []
    const days = new Set<number>()
    series.forEach((s) => s.data.forEach((p) => days.add(p.day)))
    const sorted = Array.from(days).sort((a, b) => a - b)

    return sorted.map((day) => {
      const row: Record<string, number | null> = { day }
      const values: number[] = []
      for (const s of series) {
        const p = s.data.find((d) => d.day === day)
        const v = p?.value ?? null
        row[String(s.year)] = v
        if (v != null) values.push(v)
      }
      // Promedio histórico: media aritmética de los años con dato en ese día.
      row.avg = values.length
        ? +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
        : null
      return row
    })
  }, [series])

  if (chartData.length === 0) return null

  return (
    <div className="rounded-xl border border-border bg-background/30 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">Rendimiento estacional</h3>
          <p className="text-xs text-muted-foreground">
            {etf.ticker} · cierre ajustado por día del año (P0: apertura del año) · la línea
            punteada es el promedio histórico por día
          </p>
        </div>
      </div>

      <div className="mt-3">
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={chartData} margin={{ top: 8, right: 40, bottom: 4, left: 4 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              strokeOpacity={0.35}
              vertical={false}
            />
            {/* Líneas verticales sutiles al inicio de cada mes */}
            <CartesianGrid
              strokeDasharray="2 4"
              stroke="#334155"
              strokeOpacity={0.12}
              horizontal={false}
              verticalPoints={MONTH_START_DAYS}
            />
            <ReferenceLine
              y={0}
              stroke="#94a3b8"
              strokeOpacity={0.4}
              strokeWidth={1.5}
            />
            <XAxis
              dataKey="day"
              type="number"
              domain={[1, 365]}
              tickFormatter={formatMonth}
              ticks={MONTH_START_DAYS}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={{ stroke: '#334155', strokeOpacity: 0.5 }}
              tickLine={{ stroke: '#334155', strokeOpacity: 0.25 }}
              dy={6}
            />
            <YAxis
              tickFormatter={formatPct}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={{ stroke: '#334155', strokeOpacity: 0.25 }}
              width={46}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                fontSize: '13px',
              }}
              itemStyle={{ padding: '2px 0' }}
              formatter={(value: number, name: string) => [
                `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`,
                name === 'avg' ? 'Promedio' : name,
              ]}
              labelFormatter={(day: number) => {
                const m = dayToMonth(day)
                return `${MONTH_LABELS[m]} ${day - (MONTH_START_DAYS[m] - 1)}`
              }}
            />

            {/* Promedio histórico punteado */}
            <Line
              dataKey="avg"
              type="monotone"
              stroke={AVG_COLOR}
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={false}
              activeDot={{ r: 3, fill: '#1e293b', stroke: AVG_COLOR, strokeWidth: 2 }}
              isAnimationActive={false}
            />

            {series.map((s) => {
              const cfg = lineStyle(s.year)
              return (
                <Line
                  key={s.year}
                  type="monotone"
                  dataKey={String(s.year)}
                  stroke={YEAR_COLORS[s.year] ?? '#64748b'}
                  strokeWidth={cfg.width}
                  dot={false}
                  activeDot={{
                    r: s.year === CURRENT_YEAR ? 4 : 3,
                    fill: '#1e293b',
                    stroke: YEAR_COLORS[s.year] ?? '#64748b',
                    strokeWidth: 2,
                  }}
                  isAnimationActive={false}
                />
              )
            })}

            <Customized component={YearEndLabels} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <Legend />
    </div>
  )
}