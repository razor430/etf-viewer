import type { SectorCategory } from '@/types/etf'

/** Etiquetas en español para cada sector fino. */
export const SECTOR_LABELS: Record<SectorCategory, string> = {
  Technology: 'Tecnología',
  'Health Care': 'Salud',
  Financials: 'Finanzas',
  Energy: 'Energía',
  'Consumer Discretionary': 'Consumo Discrecional',
  'Consumer Staples': 'Consumo Masivo',
  Industrials: 'Industria',
  Materials: 'Materiales',
  Utilities: 'Utilities',
  'Real Estate': 'Real Estate',
  'Communication Services': 'Telecomunicaciones',
  'Emerging Markets': 'Mercados Emergentes',
  'Developed Markets': 'Mercados Desarrollados',
  'Commodities': 'Materias Primas',
  'Fixed Income': 'Renta Fija',
  Thematic: 'Temático',
  'Broad Market': 'Mercado Amplio',
}

/** Descripción corta para tooltips / subtítulos de cada sector. */
export const SECTOR_DESCRIPTIONS: Partial<Record<SectorCategory, string>> = {
  Technology: 'Software, semiconductores, hardware y servicios tecnológicos.',
  'Health Care': 'Farmacéuticas, biotecnología y seguros de salud.',
  Financials: 'Bancos, seguros, fintech y gestión de activos.',
  Energy: 'Petróleo, gas, refinación y equipos energéticos.',
  'Consumer Discretionary': 'Retail, autos, hotelería y entretenimiento.',
  'Consumer Staples': 'Alimentos, bebidas, tabaco y producto de consumo básico.',
  Industrials: 'Aeroespacial, transporte, maquinaria y defensa.',
  Materials: 'Químicos, metales, minería y materiales de construcción.',
  Utilities: 'Electricidad, gas natural y agua regulados.',
  'Real Estate': 'REITs de residencial, oficinas, data centers y salud.',
  'Communication Services': 'Medios digitales, telecomunicaciones y streaming.',
  'Emerging Markets': 'Mercados en desarrollo: Asia, Latinoamérica, EMEA.',
  'Developed Markets': 'Mercados desarrollados: Europa, Japón, etc.',
  'Commodities': 'Oro, plata, petróleo y materias primas.',
  'Fixed Income': 'Bonos de tesorería, corporativos y alta rentabilidad.',
  Thematic: 'Fondos temáticos de innovación disruptiva: genómica, robótica, fintech e internet (serie ARK).',
  'Broad Market': 'ETFs indexados al mercado amplio (S&P 500, Nasdaq-100...).',
}

/** Paleta para el donut de composición (aplanada por sector). */
export const SECTOR_COLORS: Record<SectorCategory, string> = {
  Technology: '#22d3ee',
  'Health Care': '#34d399',
  Financials: '#818cf8',
  Energy: '#f59e0b',
  'Consumer Discretionary': '#fb7185',
  'Consumer Staples': '#a3e635',
  Industrials: '#60a5fa',
  Materials: '#f97316',
  Utilities: '#facc15',
  'Real Estate': '#2dd4bf',
  'Communication Services': '#e879f9',
  'Emerging Markets': '#f472b6',
  'Developed Markets': '#c084fc',
  'Commodities': '#fbbf24',
  'Fixed Income': '#a78bfa',
  Thematic: '#e879f9',
  'Broad Market': '#94a3b8',
}

/** Devuelve el color de un sector, con fallback por si el dato es libre. */
export function sectorColor(sector: string): string {
  return SECTOR_COLORS[sector as SectorCategory] ?? '#94a3b8'
}

/** Devuelve la etiqueta en español de una categoría (o el valor crudo). */
export function sectorLabel(sector: string): string {
  return SECTOR_LABELS[sector as SectorCategory] ?? sector
}