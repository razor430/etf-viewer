import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Combina clases condicionalmente y resuelve conflictos de Tailwind. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/** Formatea un número monetario. `compact` usa notación abreviada (e.g. 1,2 B). */
export function formatCurrency(value: number, compact = true): string {
  const abs = Math.abs(value)
  if (compact && abs >= 1e12) return `$${(value / 1e12).toFixed(2)} T`
  if (compact && abs >= 1e9) return `$${(value / 1e9).toFixed(1)} B`
  if (compact && abs >= 1e6) return `$${(value / 1e6).toFixed(0)} M`
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
}

/** Formatea un porcentaje con signo (para rendimientos). */
export function formatPercent(value: number, digits = 2): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(digits)}%`
}

/** Formatea un porcentaje sin signo (expense ratio / yield). */
export function formatPercentPlain(value: number, digits = 2): string {
  return `${value.toFixed(digits)}%`
}

/** Normaliza un ticker (mayúsculas, sin espacios) para búsquedas. */
export function normalizeTicker(value: string): string {
  return value.trim().toUpperCase()
}