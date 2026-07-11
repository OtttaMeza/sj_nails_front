'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { AlertTriangle, HelpCircle, X } from 'lucide-react'

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'default'
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm debe usarse dentro de ConfirmProvider')
  return ctx
}

interface DialogState {
  options: ConfirmOptions
  resolve: (value: boolean) => void
}

const variantConfig = {
  danger: {
    icon: AlertTriangle,
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
    confirmBtn: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    confirmBtn: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20',
  },
  default: {
    icon: HelpCircle,
    iconBg: 'bg-brand-primary/10',
    iconColor: 'text-brand-primary',
    confirmBtn: 'bg-brand-primary hover:bg-brand-primary-dark shadow-brand-primary/20',
  },
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null)

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog({ options, resolve })
    })
  }, [])

  function handleConfirm() {
    dialog?.resolve(true)
    setDialog(null)
  }

  function handleCancel() {
    dialog?.resolve(false)
    setDialog(null)
  }

  const cfg = variantConfig[dialog?.options.variant ?? 'default']
  const Icon = cfg.icon

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {dialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 mx-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Cabecera */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
                  <Icon className={`w-5 h-5 ${cfg.iconColor}`} />
                </div>
                <h2 className="text-base font-black text-slate-950 leading-snug">
                  {dialog.options.title}
                </h2>
              </div>
              <button
                onClick={handleCancel}
                className="text-slate-400 hover:text-slate-700 rounded-lg p-1 hover:bg-slate-100 smooth-transition shrink-0 mt-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mensaje */}
            {dialog.options.message && (
              <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed pl-[52px]">
                {dialog.options.message}
              </p>
            )}

            {/* Acciones */}
            <div className="flex gap-3 mt-2">
              <button
                onClick={handleCancel}
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 smooth-transition"
              >
                {dialog.options.cancelLabel ?? 'Cancelar'}
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 rounded-xl px-4 py-2.5 text-xs font-bold text-white smooth-transition shadow-md ${cfg.confirmBtn}`}
              >
                {dialog.options.confirmLabel ?? 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
