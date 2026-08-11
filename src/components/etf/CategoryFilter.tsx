import { FolderKanban } from 'lucide-react'
import { CATEGORY_ICONS, CATEGORY_LABELS, CATEGORY_ORDER } from '@/data/categories'
import type { CategoryFilter } from '@/types/etf'
import { cn } from '@/lib/utils'

export interface CategoryFilterProps {
  value: CategoryFilter
  onChange: (category: CategoryFilter) => void
  /** Número de ETFs por categoría para mostrarlo como contador opcional. */
  counts?: Partial<Record<CategoryFilter, number>>
}

/**
 * Barra de pestañas principal: agrupa el universo de ETFs por tipo de activo
 * (Índices, Sectores, Commodities y Bonos), con contador por categoría.
 * Responsiva: hace wrap / scroll horizontal en móviles.
 */
export function CategoryFilter({ value, onChange, counts }: CategoryFilterProps) {
  return (
    <div className="flex w-full flex-wrap items-center gap-3">
      <div className="hidden shrink-0 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground md:flex">
        <FolderKanban className="h-4 w-4" />
        <span>Categorías</span>
      </div>

      <div
        role="tablist"
        aria-label="Filtro por categoría"
        className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-1"
      >
        {CATEGORY_ORDER.map((category) => {
          const active = value === category
          return (
            <button
              key={category}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(category)}
              className={cn(
                'group flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-200',
                active
                  ? 'border-primary/50 bg-primary/15 text-primary'
                  : 'border-border bg-card/40 text-muted-foreground hover:border-border/80 hover:bg-muted/50 hover:text-foreground',
              )}
            >
              <span aria-hidden="true" className="text-base leading-none">
                {CATEGORY_ICONS[category]}
              </span>
              <span className="whitespace-nowrap">
                {category === 'All' ? 'Todos' : CATEGORY_LABELS[category]}
              </span>
              {counts && counts[category] !== undefined && (
                <span
                  className={cn(
                    'rounded-full px-1.5 text-[11px] font-semibold tabular-nums',
                    active ? 'bg-primary/25 text-primary' : 'bg-muted/80 text-muted-foreground',
                  )}
                >
                  {counts[category]}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}