'use client'

import { useEffect, useRef } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  maxWidth?: string
  align?: 'top' | 'center'
  hideCloseButton?: boolean
}

export function Modal({ open, onClose, children, maxWidth = 'max-w-2xl', align = 'top', hideCloseButton = false }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-50 flex ${align === 'center' ? 'items-center' : 'items-start'} justify-center overflow-y-auto atlas-modal-backdrop px-4 py-8`}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className={`relative bg-atlas-panel rounded-modal border border-atlas-rule atlas-modal-shadow w-full ${maxWidth}`}>
        {!hideCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center border border-atlas-rule text-atlas-muted hover:text-atlas-ink hover:border-atlas-muted font-mono text-sm leading-none transition-colors z-10"
            aria-label="Close"
          >
            ×
          </button>
        )}
        {children}
      </div>
    </div>
  )
}
