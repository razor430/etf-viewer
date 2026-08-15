import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

type ModalSize = 'md' | 'lg' | 'xl'

const SIZE_CLASSES: Record<ModalSize, string> = {
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  children: ReactNode
  /** Tamaño del panel. */
  size?: ModalSize
  /** Oculta el botón de cerrar (X). */
  hideClose?: boolean
  className?: string
}

/**
 * Modal/Drawer accesible con portal, cierre por teclado (Esc), overlay y
 * bloqueo del scroll del body mientras está abierto.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'lg',
  hideClose = false,
  className,
}: ModalProps) {
  // Cerrar con Escape + bloquear scroll del fondo.
  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      {/* Overlay */}
      <div
        className="fixed inset-0 animate-fade-in bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : 'Detalle del ETF'}
        className={cn(
          'relative z-10 my-auto w-full animate-scale-in rounded-2xl border border-border bg-card text-card-foreground shadow-2xl',
          SIZE_CLASSES[size],
          className,
        )}
      >
        {(title || !hideClose) && (
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
            <div className="min-w-0">
              {title && <h2 className="text-lg font-semibold tracking-tight">{title}</h2>}
              {description && (
                <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            {!hideClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Cerrar"
                className="shrink-0"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  )
}