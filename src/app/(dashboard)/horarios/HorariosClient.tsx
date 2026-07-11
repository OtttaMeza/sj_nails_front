'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  Clock,
  Calendar,
  Scissors,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Building2,
  Loader2,
  Plus,
  X,
  FileText,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from 'lucide-react'
import { WeeklyScheduleDay, SalonServiceResponse, SalonResponse, UserRole, ScheduleOverrideResponse } from '@/lib/types'
import { getWeeklyScheduleAction, createScheduleOverrideAction, getScheduleOverridesAction, deleteScheduleOverrideAction } from './actions'
import { getAvailableSlotsAction } from '../citas/actions'
import { useToast } from '@/components/ui/ToastProvider'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import DatePicker from '@/components/ui/DatePicker'
import TimeRangePicker from '@/components/ui/TimeRangePicker'
import { format, parseISO } from 'date-fns'

interface Props {
  initialWeekly: WeeklyScheduleDay[]
  initialSalons: SalonResponse[]
  initialServices: SalonServiceResponse[]
  initialOverrides: ScheduleOverrideResponse[]
  role: UserRole
}

const DAY_LABELS: Record<string, string> = {
  MONDAY:    'Lunes',
  TUESDAY:   'Martes',
  WEDNESDAY: 'Miércoles',
  THURSDAY:  'Jueves',
  FRIDAY:    'Viernes',
  SATURDAY:  'Sábado',
  SUNDAY:    'Domingo',
}

const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

function formatTime(t: string) {
  if (!t) return '—'
  const parts = t.split(':')
  return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : t
}

export default function HorariosClient({ initialWeekly, initialSalons, initialServices, initialOverrides, role }: Props) {
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const { toast } = useToast()
  const { confirm } = useConfirm()

  const [weekly, setWeekly] = useState<WeeklyScheduleDay[]>(initialWeekly)
  const [salons] = useState<SalonResponse[]>(initialSalons)
  const [selectedSalonId, setSelectedSalonId] = useState<string>('')
  const [loadingWeekly, setLoadingWeekly] = useState(false)
  const [overrides, setOverrides] = useState<ScheduleOverrideResponse[]>(initialOverrides)
  const [loadingOverrides, setLoadingOverrides] = useState(false)

  // Override modal state
  const [showOverride, setShowOverride] = useState(false)
  const [overrideSalonId, setOverrideSalonId] = useState<string>('')
  const [overrideDate, setOverrideDate] = useState<string>('')
  const [overrideClosed, setOverrideClosed] = useState(false)
  const [overrideOpenTime, setOverrideOpenTime] = useState<string>('')
  const [overrideCloseTime, setOverrideCloseTime] = useState<string>('')
  const [overrideReason, setOverrideReason] = useState<string>('')
  const [overrideError, setOverrideError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [selectedServiceId, setSelectedServiceId] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  async function handleSalonChange(salonId: string) {
    setSelectedSalonId(salonId)
    setWeekly([])
    setOverrides([])
    if (!salonId) return

    setLoadingWeekly(true)
    setLoadingOverrides(true)
    const [resWeekly, resOverrides] = await Promise.all([
      getWeeklyScheduleAction(Number(salonId)),
      getScheduleOverridesAction(Number(salonId)),
    ])
    if (resWeekly.ok && resWeekly.weekly) setWeekly(resWeekly.weekly)
    if (resOverrides.ok && resOverrides.overrides) setOverrides(resOverrides.overrides)
    setLoadingWeekly(false)
    setLoadingOverrides(false)
  }

  function openOverrideModal() {
    setOverrideSalonId(selectedSalonId)
    setOverrideDate('')
    setOverrideClosed(false)
    setOverrideOpenTime('')
    setOverrideCloseTime('')
    setOverrideReason('')
    setOverrideError(null)
    setShowOverride(true)
  }

  function closeOverrideModal() {
    setShowOverride(false)
    setOverrideError(null)
  }

  async function handleCreateOverride(e: React.FormEvent) {
    e.preventDefault()
    setOverrideError(null)

    const result = await createScheduleOverrideAction({
      ...(isSuperAdmin && overrideSalonId ? { salonId: Number(overrideSalonId) } : {}),
      date: overrideDate,
      closed: overrideClosed,
      ...(!overrideClosed ? { openTime: overrideOpenTime, closeTime: overrideCloseTime } : {}),
      ...(overrideReason ? { reason: overrideReason } : {}),
    })

    if (!result.ok) {
      setOverrideError(result.error ?? 'Error al crear el horario especial')
      return
    }

    const resolvedSalonId = isSuperAdmin && overrideSalonId ? Number(overrideSalonId) : undefined
    const resOverrides = await getScheduleOverridesAction(resolvedSalonId)
    if (resOverrides.ok && resOverrides.overrides) setOverrides(resOverrides.overrides)

    startTransition(() => {
      toast('Horario especial registrado exitosamente', 'success')
      closeOverrideModal()
    })
  }

  const isOverrideIncomplete =
    !overrideDate ||
    (isSuperAdmin && !overrideSalonId) ||
    (!overrideClosed && (!overrideOpenTime || !overrideCloseTime))

  useEffect(() => {
    if (!selectedServiceId || !selectedDate) {
      setAvailableSlots([])
      setSearched(false)
      return
    }

    async function fetchSlots() {
      setLoadingSlots(true)
      setSlotsError(null)
      setSearched(true)
      const res = await getAvailableSlotsAction(Number(selectedServiceId), selectedDate)
      if (res.ok && res.slots) {
        setAvailableSlots(res.slots)
      } else {
        setSlotsError(res.error ?? 'Error al obtener disponibilidad')
        setAvailableSlots([])
      }
      setLoadingSlots(false)
    }

    fetchSlots()
  }, [selectedServiceId, selectedDate])

  async function handleDeleteOverride(id: number) {
    const ok = await confirm({
      title: '¿Eliminar horario especial?',
      message: 'Esta acción no se puede deshacer.',
      confirmLabel: 'Sí, eliminar',
      variant: 'danger',
    })
    if (!ok) return

    const res = await deleteScheduleOverrideAction(id)
    if (!res.ok) {
      toast(res.error ?? 'Error al eliminar', 'error')
      return
    }
    setOverrides(prev => prev.filter(o => o.id !== id))
    toast('Horario especial eliminado', 'success')
  }

  function handleClearSimulator() {
    setSelectedServiceId('')
    setSelectedDate('')
    setAvailableSlots([])
    setSlotsError(null)
    setSearched(false)
  }

  const sortedWeekly = DAY_ORDER.map(day =>
    weekly.find(d => d.dayOfWeek === day) ?? { dayOfWeek: day, blocks: [] }
  )

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">Horarios</h1>
          <p className="text-slate-700 mt-1 text-sm font-medium">Disponibilidad comercial semanal del salón.</p>
        </div>
        {role !== 'USER' && (
          <button
            onClick={openOverrideModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-sm font-bold text-white hover:bg-brand-primary-dark smooth-transition shadow-md shadow-brand-primary/10 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Horario Especial</span>
          </button>
        )}
      </div>

      {/* Selector de negocio — solo SUPER_ADMIN */}
      {isSuperAdmin && (
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm">
          <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={selectedSalonId}
            onChange={(e) => handleSalonChange(e.target.value)}
            className="flex-1"
          >
            <option value="">Selecciona un negocio para ver sus horarios</option>
            {salons.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {loadingWeekly && <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0" />}
        </div>
      )}

      {/* Panel semanal */}
      {loadingWeekly ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-24 text-center shadow-sm">
          <Loader2 className="w-10 h-10 text-slate-300 mx-auto mb-3 animate-spin" />
          <p className="text-slate-400 text-xs">Cargando horarios...</p>
        </div>
      ) : isSuperAdmin && !selectedSalonId ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-24 text-center shadow-sm">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-700 text-sm font-bold">Selecciona un negocio</p>
          <p className="text-slate-400 text-xs mt-1">Elige un negocio en el selector para ver su disponibilidad semanal.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {sortedWeekly.map(day => {
            const isOpen = day.blocks.length > 0
            return (
              <div
                key={day.dayOfWeek}
                className={`rounded-2xl p-4 flex flex-col min-h-[160px] border shadow-sm smooth-transition
                  ${isOpen ? 'bg-white border-slate-200 hover:border-slate-300' : 'bg-slate-50 border-slate-200'}`}
              >
                {/* Cabecera del día */}
                <div className="border-b border-slate-200 pb-2 mb-3 text-center">
                  <span className={`text-xs font-black uppercase tracking-wider
                    ${isOpen ? 'text-slate-700' : 'text-slate-400'}`}>
                    {DAY_LABELS[day.dayOfWeek]}
                  </span>
                </div>

                {/* Bloques o Cerrado */}
                <div className="flex-1 flex flex-col gap-2 justify-center">
                  {isOpen ? (
                    day.blocks.map(block => (
                      <div
                        key={block.id}
                        className="bg-emerald-50 border border-emerald-200 rounded-xl px-2 py-2 text-center"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="text-[11px] font-black text-emerald-700">
                            {formatTime(block.openTime)} – {formatTime(block.closeTime)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center py-4">
                      <span className="text-xs font-bold text-slate-400 italic">Cerrado</span>
                    </div>
                  )}
                </div>

                {/* Contador de bloques */}
                {isOpen && (
                  <p className="text-[10px] text-slate-400 font-bold text-center mt-2 pt-2 border-t border-slate-100">
                    {day.blocks.length} {day.blocks.length === 1 ? 'jornada' : 'jornadas'}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Horarios Especiales Registrados */}
      {(!isSuperAdmin || selectedSalonId) && !loadingWeekly && role !== 'USER' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-primary" />
              <h2 className="text-sm font-black text-slate-950">Horarios Especiales</h2>
              {overrides.length > 0 && (
                <span className="text-[11px] font-black bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full">
                  {overrides.length}
                </span>
              )}
            </div>
            {loadingOverrides && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
          </div>

          {overrides.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-bold italic">Sin horarios especiales registrados</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {overrides.map(o => (
                <div key={o.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 smooth-transition">
                  <div className="shrink-0">
                    <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-1 rounded-lg">
                      {format(parseISO(o.date), 'dd/MM/yyyy')}
                    </span>
                  </div>
                  <div className="shrink-0">
                    {o.closed ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg">
                        Cerrado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                        <Clock className="w-3 h-3" />
                        {formatTime(o.openTime ?? '')} – {formatTime(o.closeTime ?? '')}
                      </span>
                    )}
                  </div>
                  {o.reason && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 flex-1 min-w-0">
                      <FileText className="w-3 h-3 shrink-0" />
                      <span className="truncate">{o.reason}</span>
                    </div>
                  )}
                  <button
                    onClick={() => handleDeleteOverride(o.id)}
                    className="ml-auto shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 smooth-transition cursor-pointer"
                    title="Eliminar horario especial"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Simulador de Disponibilidad — solo roles no SUPER_ADMIN o cuando hay salón seleccionado */}
      {(!isSuperAdmin || selectedSalonId) && !loadingWeekly && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-primary" />
            <h2 className="text-sm font-black text-slate-950">Consulta de Turnos Libres</h2>
          </div>

          <div className="p-5">
            <p className="text-xs text-slate-500 font-medium mb-4">
              Verifica los bloques horarios disponibles para un servicio y día específico.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Servicio */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                  <Scissors className="w-4 h-4 text-slate-500" />
                  <span>Servicio</span>
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full"
                >
                  <option value="">Selecciona un servicio</option>
                  {initialServices.filter(s => s.active).map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.durationMins} min)</option>
                  ))}
                </select>
              </div>

              {/* Fecha */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>Fecha</span>
                </label>
                <DatePicker
                  value={selectedDate}
                  onChange={setSelectedDate}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  placeholder="Selecciona una fecha"
                />
              </div>
            </div>

            {/* Resultados */}
            {searched && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-slate-900">Resultado</span>
                  <button
                    onClick={handleClearSimulator}
                    className="text-xs font-bold text-brand-primary hover:underline"
                  >
                    Limpiar
                  </button>
                </div>

                {loadingSlots ? (
                  <div className="flex items-center justify-center gap-2 py-6 bg-slate-50 rounded-xl border border-slate-200">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
                    <span className="text-xs font-bold text-slate-600">Consultando disponibilidad...</span>
                  </div>
                ) : slotsError ? (
                  <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-rose-700 font-bold">{slotsError}</p>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 border border-slate-200 rounded-xl">
                    <p className="text-xs text-slate-500 font-bold italic">No hay disponibilidad para esta fecha.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="inline-flex items-center gap-1.5 text-xs font-black text-white bg-emerald-600 px-3 py-1 rounded-full shadow-sm">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {availableSlots.length} turnos libres
                    </p>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-[160px] overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50">
                      {availableSlots.map(slot => (
                        <span
                          key={slot}
                          className="px-2 py-1.5 rounded-lg text-[11px] font-black text-center bg-white border border-slate-200 text-slate-900 shadow-sm"
                        >
                          {slot}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Modal Horario Especial */}
      {showOverride && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 mx-4 relative">
            {/* Cabecera */}
            <div className="flex items-center justify-between mb-5 border-b border-slate-200 pb-3">
              <h2 className="text-lg font-black text-slate-950 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-primary" />
                <span>Horario Especial</span>
              </h2>
              <button
                onClick={closeOverrideModal}
                className="text-slate-500 hover:text-slate-800 rounded-lg p-1 hover:bg-slate-100 smooth-transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOverride} className="space-y-4">
              {/* Negocio — solo SUPER_ADMIN */}
              {isSuperAdmin && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <span>Negocio *</span>
                  </label>
                  <select
                    value={overrideSalonId}
                    onChange={(e) => setOverrideSalonId(e.target.value)}
                    className="w-full"
                    required
                  >
                    <option value="">Selecciona un negocio</option>
                    {salons.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Fecha */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>Fecha *</span>
                </label>
                <DatePicker
                  value={overrideDate}
                  onChange={setOverrideDate}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  placeholder="Selecciona una fecha"
                />
              </div>

              {/* Toggle Cerrado */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <div>
                  <p className="text-xs font-bold text-slate-900">Día cerrado</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {overrideClosed ? 'El salón no abrirá este día' : 'El salón abrirá este día'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOverrideClosed(v => !v)}
                  className="smooth-transition"
                >
                  {overrideClosed
                    ? <ToggleRight className="w-8 h-8 text-rose-500" />
                    : <ToggleLeft className="w-8 h-8 text-slate-400" />
                  }
                </button>
              </div>

              {/* Horario — solo si NO está cerrado */}
              {!overrideClosed && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span>Horario *</span>
                  </label>
                  <TimeRangePicker
                    startTime={overrideOpenTime}
                    endTime={overrideCloseTime}
                    onStartChange={setOverrideOpenTime}
                    onEndChange={setOverrideCloseTime}
                  />
                </div>
              )}

              {/* Motivo */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>Motivo</span>
                </label>
                <input
                  type="text"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder={overrideClosed ? 'Ej. Día de Boyacá' : 'Ej. Turno mañana'}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-xs font-semibold text-slate-950 focus:outline-none focus:ring-2 focus:ring-brand-primary-500/20 focus:border-brand-primary-600 smooth-transition shadow-sm"
                />
              </div>

              {/* Error */}
              {overrideError && (
                <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                  {overrideError}
                </p>
              )}

              {/* Acciones */}
              <div className="flex gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeOverrideModal}
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100 smooth-transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || isOverrideIncomplete}
                  className="flex-1 rounded-xl bg-brand-primary px-4 py-3 text-xs font-bold text-white hover:bg-brand-primary-dark disabled:opacity-50 disabled:cursor-not-allowed smooth-transition shadow-sm"
                >
                  {isPending ? 'Guardando...' : 'Guardar horario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
