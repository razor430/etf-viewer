import { useMemo } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, type TooltipProps } from 'recharts'
import { Activity, CalendarRange, CircleDollarSign, Percent, Scale, Sigma } from 'lucide-react'
import type { Etf, Holding } from '@/types/etf'
import { sectorColor, sectorLabel } from '@/data/sectors'
import { cn, formatCurrency, formatPercent, formatPercentPlain } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { SeasonalReturnsChart } from '@/components/etf/SeasonalReturnsChart'

export interface EtfDetailModalProps {
  etf: Etf | null
  onClose: () => void
}

interface SectorSlice {
  sector: string
  value: number
  color: string
}

/** Métrica clave resumida en un chip. */
function KeyMetric({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Activity
  label: string
  value: string
  accent?: string
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-background/40 px-2 py-3 text-center">
      <span
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60',
          accent ?? 'text-accent',
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-bold tabular-nums">{value}</span>
    </div>
  )
}

/** Tooltip custom para el donut (tema oscuro). */
function DonutTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null
  const entry = payload[0]?.payload as SectorSlice | undefined
  if (!entry) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-xl">
      <p className="font-medium">{sectorLabel(entry.sector)}</p>
      <p className="tabular-nums text-accent">{entry.value.toFixed(2)}%</p>
    </div>
  )
}

/**
 * Desglose completo de un ETF: donut de composición sectorial, tabla con el
 * Top-20 de holdings (ponderación + acumulado) y métricas clave.
 */
export function EtfDetailModal({ etf, onClose }: EtfDetailModalProps) {
  const sectorSlices = useMemo<SectorSlice[]>(() => {
    if (!etf) return []
    const acc = new Map<string, number>()
    for (const h of etf.topHoldings) {
      acc.set(h.sector, (acc.get(h.sector) ?? 0) + h.weight)
    }
    return Array.from(acc.entries())
      .map(([sector, value]) => ({ sector, value, color: sectorColor(sector) }))
      .sort((a, b) => b.value - a.value)
  }, [etf])

  // Filas con acumulado del Top-20.
  const holdingsRows = useMemo(() => {
    if (!etf) return []
    let cum = 0
    return etf.topHoldings.map((h) => {
      cum += h.weight
      return { holding: h, cumulative: cum }
    })
  }, [etf])

  const top20Total = holdingsRows.reduce((sum, row) => sum + row.holding.weight, 0)

  if (!etf) return null

  return (
    <Modal
      open={!!etf}
      onClose={onClose}
      size="xl"
      title={<span className="flex items-center gap-2">{etf.ticker}</span>}
      description={etf.name}
    >
      <div className="px-5 py-5 sm:px-6">
        {/* Fila superior: descripción + sector */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-md text-sm text-muted-foreground">{etf.description}</p>
          <Badge variant="accent">{sectorLabel(etf.sector)}</Badge>
        </div>

        {/* Métricas clave */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <KeyMetric icon={Percent} label="P/E Ratio" value={etf.peRatio.toFixed(1)} />
          <KeyMetric
            icon={CircleDollarSign}
            label="Div Yield"
            value={formatPercentPlain(etf.dividendYield)}
            accent="text-success"
          />
          <KeyMetric icon={Activity} label="Beta" value={etf.beta.toFixed(2)} />
          <KeyMetric
            icon={Sigma}
            label="Ret. 1 año"
            value={formatPercent(etf.return1y)}
            accent={etf.return1y >= 0 ? 'text-success' : 'text-danger'}
          />
          <KeyMetric icon={Scale} label="Expense" value={formatPercentPlain(etf.expenseRatio)} />
          <KeyMetric icon={CalendarRange} label="AUM" value={formatCurrency(etf.aum, true)} />
        </div>

        {/* Donut de composición sectorial */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
          <div className="rounded-xl border border-border bg-background/30 p-4">
            <h3 className="text-sm font-semibold">Composición sectorial</h3>
            <p className="text-xs text-muted-foreground">
              Distribución interna a partir del Top-20.
            </p>
            <div className="relative mx-auto mt-2 h-56 w-full max-w-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sectorSlices}
                    dataKey="value"
                    nameKey="sector"
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={2}
                    stroke="none"
                    isAnimationActive
                  >
                    {sectorSlices.map((slice) => (
                      <Cell key={slice.sector} fill={slice.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Centro del donut */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold tabular-nums text-foreground">
                  {top20Total.toFixed(1)}%
                </span>
                <span className="text-[11px] text-muted-foreground">Top-20</span>
              </div>
            </div>
            {/* Leyenda */}
            <ul className="mt-2 flex flex-col gap-1.5">
              {sectorSlices.map((slice) => (
                <li key={slice.sector} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{ backgroundColor: slice.color }}
                    />
                    {sectorLabel(slice.sector)}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {slice.value.toFixed(2)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tabla Top-20 holdings */}
          <div className="flex flex-col rounded-xl border border-border bg-background/30">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold">Top 20 Holdings</h3>
                <p className="text-xs text-muted-foreground">
                  {etf.holdingsCount} posiciones en total · Top-20 concentra el{' '}
                  <span className="font-semibold text-accent">
                    {top20Total.toFixed(1)}%
                  </span>{' '}
                  de la cartera
                </p>
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-card">
                  <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2 font-medium">#</th>
                    <th className="px-2 py-2 font-medium">Empresa</th>
                    <th className="px-2 py-2 font-medium">Sector</th>
                    <th className="px-2 py-2 text-right font-medium">Peso</th>
                    <th className="px-4 py-2 text-right font-medium">Acumulado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {holdingsRows.map(({ holding, cumulative }, index) => (
                    <HoldingRow
                      key={`${holding.ticker}-${index}`}
                      holding={holding}
                      cumulative={cumulative}
                      rank={index + 1}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Gráfico de rendimiento estacional */}
        <div className="mt-6">
          <SeasonalReturnsChart etf={etf} />
        </div>
      </div>
    </Modal>
  )
}

/** Fila individual de la tabla de Top-20 holdings, con barra de peso y acumulado. */
function HoldingRow({
  holding,
  cumulative,
  rank,
}: {
  holding: Holding
  cumulative: number
  rank: number
}) {
  return (
    <tr className="transition-colors hover:bg-muted/40">
      <td className="px-4 py-2.5 text-xs font-medium tabular-nums text-muted-foreground">
        {rank}
      </td>
      <td className="min-w-[180px] px-2 py-2.5">
        <p className="font-medium leading-tight text-foreground">{holding.name}</p>
        <p className="text-xs font-semibold uppercase text-accent">{holding.ticker}</p>
      </td>
      <td className="px-2 py-2.5">
        <Badge variant="muted" className="max-w-[130px]">
          <span className="truncate">{sectorLabel(holding.sector)}</span>
        </Badge>
      </td>
      <td className="px-2 py-2.5 text-right">
        <div className="flex items-center justify-end gap-2">
          <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted/70 sm:w-20">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min((holding.weight / 24) * 100, 100)}%`,
                backgroundColor: sectorColor(holding.sector),
              }}
            />
          </div>
          <span className="font-semibold tabular-nums">{holding.weight.toFixed(2)}%</span>
        </div>
      </td>
      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
        {cumulative.toFixed(1)}%
      </td>
    </tr>
  )
}