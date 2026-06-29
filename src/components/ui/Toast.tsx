'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, X } from 'lucide-react'

interface ToastProps {
  message: string
  variant: 'success' | 'error'
  exiting: boolean
  onDismiss: () => void
}

export function Toast({ message, variant, exiting, onDismiss }: ToastProps) {
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const visible = entered && !exiting
  const Icon = variant === 'success' ? CheckCircle2 : XCircle

  return (
    <div
      className={`
        pointer-events-auto flex items-center gap-3 px-4 py-3.5 rounded-xl shadow-lg
        border text-sm font-bold text-white min-w-[280px] max-w-sm
        transition-all duration-300 ease-out
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6'}
        ${variant === 'success'
          ? 'bg-brand-success border-[#0ea95f]'
          : 'bg-brand-error border-[#e03025]'
        }
      `}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="flex-1 leading-snug">{message}</span>
      <button
        onClick={onDismiss}
        aria-label="Cerrar notificación"
        className="opacity-70 hover:opacity-100 transition-opacity cursor-pointer flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
