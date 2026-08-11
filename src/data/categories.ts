import type { CategoryFilter, EtfCategory } from '@/types/etf'

/** Etiquetas en español para cada categoría de ETF. */
export const CATEGORY_LABELS: Record<EtfCategory, string> = {
  indices: 'Índices',
  sectores: 'Sectores',
  commodities: 'Commodities',
  'renta-fija': 'Bonos',
}

/** Orden de visualización de las pestañas de categoría. */
export const CATEGORY_ORDER: CategoryFilter[] = [
  'All',
  'indices',
  'sectores',
  'commodities',
  'renta-fija',
]

/** Íconos (emoji) para cada categoría. */
export const CATEGORY_ICONS: Record<CategoryFilter, string> = {
  All: '🌐',
  indices: '📈',
  sectores: '🏭',
  commodities: '🛢️',
  'renta-fija': '💵',
}

/** Descripción corta para tooltips por categoría. */
export const CATEGORY_DESCRIPTIONS: Record<EtfCategory, string> = {
  indices: 'ETFs que replican índices: S&P 500, Dow, Nasdaq-100 y mercados globales.',
  sectores: 'ETFs sectoriales del S&P 500 (serie XL* y temáticos sectoriales).',
  commodities: 'Exposición a materias primas: oro, plata, petróleo y el agregado.',
  'renta-fija': 'Bonos del Tesoro, corporativos y de alta rentabilidad (high yield).',
}

/** Devuelve la etiqueta en español de un `EtfCategory`. */
export function categoryLabel(category: EtfCategory): string {
  return CATEGORY_LABELS[category]
}