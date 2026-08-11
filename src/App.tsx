import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, LineChart, Moon, Search, SearchX, Sun, TrendingUp } from 'lucide-react'
import type { CategoryFilter, Etf, Holding } from '@/types/etf'
import { fetchEtfs, matchingHoldings, queryEtfs } from '@/services/etfService'
import { categoryLabel } from '@/data/categories'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { CategoryFilter as CategoryFilterBar } from '@/components/etf/CategoryFilter'
import { EtfCard } from '@/components/etf/EtfCard'
import { EtfDetailModal } from '@/components/etf/EtfDetailModal'

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
      No pudimos cargar los datos: {message}
    </div>
  )
}

/** Campo de ordenamiento de los resultados visibles. */
type SortKey = 'aum' | 'ticker'

/** Dirección del ordenamiento activo. */
type SortDir = 'asc' | 'desc'

export default function App() {
  const [allEtfs, setAllEtfs] = useState<Etf[]>([])
  const [visible, setVisible] = useState<Etf[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState<CategoryFilter>('All')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [selected, setSelected] = useState<Etf | null>(null)
  const [dark, setDark] = useState(true)

  // ── Tema (persistente) ──────────────────────────────────────────
  useEffect(() => {
    const el = document.documentElement
    el.classList.toggle('dark', dark)
    localStorage.setItem('etf-theme', dark ? 'dark' : 'light')
  }, [dark])

  // ── Carga del universo completo (para contadores) ────────────────
  useEffect(() => {
    fetchEtfs()
      .then(setAllEtfs)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar los datos'))
  }, [])

  // ── Query (filtro por categoría + búsqueda) con debounce ─────────
  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await queryEtfs({ category, search })
        setVisible(res)
        setError(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al filtrar los ETFs')
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [category, search])

  const categoryCounts = useMemo<Partial<Record<CategoryFilter, number>>>(() => {
    const counts: Partial<Record<CategoryFilter, number>> = { All: allEtfs.length }
    for (const etf of allEtfs) {
      counts[etf.category] = (counts[etf.category] ?? 0) + 1
    }
    return counts
  }, [allEtfs])

  // Coincidencias por tenencia para la consulta activa (se destacan en las tarjetas).
  const holdingMatches = useMemo<Record<string, Holding[]>>(() => {
    const matches: Record<string, Holding[]> = {}
    if (!search.trim()) return matches
    for (const etf of visible) {
      const found = matchingHoldings(etf, search)
      if (found.length > 0) matches[etf.id] = found
    }
    return matches
  }, [visible, search])

  const hasHoldingMatches = Object.keys(holdingMatches).length > 0

  // ── Ordenamiento (toggle por AUM / ticker, asc / desc) ───────
  /** Alterna la dirección del campo activo, o lo activa con su orden más útil. */
  function toggleSort(next: SortKey) {
    if (sortKey === next) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(next)
    setSortDir(next === 'ticker' ? 'asc' : 'desc')
  }

  /** Resultados visibles ordenados según `sortKey` / `sortDir`. */
  const sortedEtfs = useMemo<Etf[]>(() => {
    if (!sortKey) return visible
    const dir = sortDir === 'asc' ? 1 : -1
    return [...visible].sort((a, b) =>
      sortKey === 'aum'
        ? (a.aum - b.aum) * dir
        : a.ticker.localeCompare(b.ticker, 'es', { sensitivity: 'base' }) * dir,
    )
  }, [visible, sortKey, sortDir])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <LineChart className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <h1 className="text-base font-bold tracking-tight">
                ETF <span className="text-accent">Explorer</span>
              </h1>
              <p className="text-[11px] text-muted-foreground">
                Análisis por categoría · US Market
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="success" className="hidden sm:inline-flex">
              <TrendingUp className="h-3 w-3" />
              Live · {new Date().toLocaleDateString('es-AR')}
            </Badge>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDark((d) => !d)}
              aria-label="Cambiar tema"
              className="border-border/80"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Título de sección */}
        <section className="mb-5">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            ETFs agrupados por categoría
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Explorá los fondos por tipo de activo — índices, sectores, commodities y bonos —,
            refiná por subsector/mercado y desglosá composición, ponderaciones y rendimiento.
          </p>
        </section>

        {/* Controles: filtro por categoría + búsqueda */}
        <section className="space-y-4">
          <CategoryFilterBar
            value={category}
            onChange={setCategory}
            counts={categoryCounts}
          />

          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por ticker, nombre o tenencia (ej. AAPL, NVDA, Oro...)"
              className="pl-9"
              aria-label="Buscar ETF"
            />
          </div>
        </section>

        <section className="mt-6">
          {/* Estado de error */}
          {error && <ErrorBanner message={error} />}

          {!error && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{visible.length}</span>
                {visible.length === 1 ? 'ETF encontrado' : 'ETFs encontrados'}
                {category !== 'All' && (
                  <>
                    {' '}
                    en{' '}
                    <span className="font-medium text-accent">{categoryLabel(category)}</span>
                  </>
                )}
                {hasHoldingMatches && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                    {search.trim().toUpperCase()} en tenencias
                  </span>
                )}
              </div>

              {visible.length > 1 && (
                <div className="flex items-center gap-2" role="group" aria-label="Ordenar resultados">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-pressed={sortKey === 'ticker'}
                    title={
                      sortKey === 'ticker'
                        ? sortDir === 'asc'
                          ? 'Ordenado A → Z · click para Z → A'
                          : 'Ordenado Z → A · click para A → Z'
                        : 'Ordenar por ticker'
                    }
                    onClick={() => toggleSort('ticker')}
                    className={cn(
                      'rounded-full border',
                      sortKey === 'ticker'
                        ? 'border-primary/50 bg-primary/15 text-primary hover:bg-primary/20'
                        : 'border-transparent text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {sortKey === 'ticker' ? (
                      sortDir === 'asc' ? (
                        <ArrowUp className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    )}
                    Ticker
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    aria-pressed={sortKey === 'aum'}
                    title={
                      sortKey === 'aum'
                        ? sortDir === 'desc'
                          ? 'Mayor AUM primero · click para menor primero'
                          : 'Menor AUM primero · click para mayor primero'
                        : 'Ordenar por AUM'
                    }
                    onClick={() => toggleSort('aum')}
                    className={cn(
                      'rounded-full border',
                      sortKey === 'aum'
                        ? 'border-primary/50 bg-primary/15 text-primary hover:bg-primary/20'
                        : 'border-transparent text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {sortKey === 'aum' ? (
                      sortDir === 'desc' ? (
                        <ArrowDown className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowUp className="h-3.5 w-3.5" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    )}
                    AUM
                  </Button>
                </div>
              )}
            </div>
          )}

          {!error && loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-[220px] rounded-xl" />
              ))}
            </div>
          ) : (
            !error &&
            (visible.length === 0 ? (
              <EmptyState
                hasQuery={search.trim().length > 0}
                onReset={() => {
                  setSearch('')
                  setCategory('All')
                }}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {sortedEtfs.map((etf) => (
                  <EtfCard
                    key={etf.id}
                    etf={etf}
                    onSelect={setSelected}
                    matchedHoldings={holdingMatches[etf.id]}
                  />
                ))}
              </div>
            ))
          )}
        </section>
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-8 pt-2 text-center text-xs text-muted-foreground sm:px-6">
        Datos de referencia aproximados · No constituye asesoramiento financiero.
      </footer>

      {/* Detalle del ETF seleccionado */}
      <EtfDetailModal etf={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

function EmptyState({
  hasQuery,
  onReset,
}: {
  hasQuery: boolean
  onReset: () => void
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-16 text-center',
      )}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted/60">
        <SearchX className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="font-semibold">
        {hasQuery ? 'Sin resultados para tu búsqueda' : 'No hay ETFs para esta selección'}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {hasQuery
          ? 'Probalo con otro ticker, nombre o activo en sus tenencias.'
          : 'Aún no cargamos fondos con estos criterios.'}
      </p>
      <Button variant="outline" className="mt-4" onClick={onReset}>
        Limpiar filtros
      </Button>
    </div>
  )
}