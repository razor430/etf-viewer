import { ArrowUpRight, CalendarRange, CircleDollarSign, Layers } from 'lucide-react'
import type { Etf, Holding } from '@/types/etf'
import { categoryLabel } from '@/data/categories'
import { sectorLabel } from '@/data/sectors'
import { cn, formatCurrency, formatPercent, formatPercentPlain } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'

export interface EtfCardProps {
  etf: Etf
  onSelect: (etf: Etf) => void
  /** Tenencias del ETF que coinciden con la búsqueda activa (para destacarlas). */
  matchedHoldings?: Holding[]
}

/** Color semántico para rendimientos (verde esmeralda / rojo coral). */
function performanceClass(value: number): string {
  return value >= 0 ? 'text-success' : 'text-danger'
}

/** Columna de métrica reutilizable dentro de la tarjeta. */
function Metric({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className={cn('mt-0.5 truncate text-sm font-semibold tabular-nums', valueClass)}>
        {value}
      </dd>
    </div>
  )
}

/**
 * Tarjeta resumen de un ETF. Muestra ticker, sector, AUM, expense ratio,
 * precio y rendimientos (YTD / 1Y). Al hacer clic abre el detalle completo.
 */
export function EtfCard({ etf, onSelect, matchedHoldings }: EtfCardProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onSelect(etf)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(etf)
        }
      }}
      className="group relative cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_10px_40px_-12px_rgba(34,211,238,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Brillo de esquina */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-foreground">
              {etf.ticker}
            </span>
            <Badge variant="accent">{categoryLabel(etf.category)}</Badge>
            <Badge variant="muted" className="hidden sm:inline-flex">
              {sectorLabel(etf.sector)}
            </Badge>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{etf.name}</p>
            {matchedHoldings && matchedHoldings.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
                  En tenencias
                </span>
                {matchedHoldings.slice(0, 3).map((holding) => (
                  <span
                    key={holding.ticker}
                    title={`${holding.name} · ${formatPercentPlain(holding.weight)} de la cartera`}
                    className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground"
                  >
                    {holding.ticker} · {formatPercentPlain(holding.weight)}
                  </span>
                ))}
                {matchedHoldings.length > 3 && (
                  <span className="text-[11px] font-medium text-muted-foreground">
                    +{matchedHoldings.length - 3}
                  </span>
                )}
              </div>
            )}
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xl font-bold tabular-nums">${etf.price.toFixed(2)}</p>
          <p
            className={cn(
              'text-xs font-semibold tabular-nums',
              performanceClass(etf.ytd),
            )}
          >
            {formatPercent(etf.ytd)} YTD
          </p>
        </div>
      </div>

      <div className="relative border-t border-border/70 p-5 pt-4">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
          <Metric
            label="AUM"
            value={formatCurrency(etf.aum)}
            valueClass="flex items-center gap-1"
          />
          <Metric
            label="Expense Ratio"
            value={formatPercentPlain(etf.expenseRatio)}
          />
          <Metric
            label="Retorno 1 año"
            value={formatPercent(etf.return1y)}
            valueClass={performanceClass(etf.return1y)}
          />
        </dl>

        <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" />
              {etf.holdingsCount} posiciones
            </span>
            <span className="inline-flex items-center gap-1">
              <CircleDollarSign className="h-3.5 w-3.5" />
              Div {formatPercentPlain(etf.dividendYield)}
            </span>
            <span className="hidden items-center gap-1 sm:inline-flex">
              <CalendarRange className="h-3.5 w-3.5" />
              {etf.dataAsOf}
            </span>
          </div>
          <span className="inline-flex items-center gap-0.5 text-sm font-medium text-accent transition-transform duration-200 group-hover:translate-x-0.5">
            Analizar
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Card>
  )
}