'use client'

import { useState, useTransition, useMemo } from 'react'
import {
  Clock,
  Calendar,
  Building2,
  Loader2,
  Plus,
  X,
  FileText,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Pencil,
} from 'lucide-react'
import { WeeklyScheduleDay, SalonResponse, UserRole, ScheduleOverrideResponse } from '@/lib/types'
import { getWeeklyScheduleAction, createScheduleOverrideAction, getScheduleOverridesAction, deleteScheduleOverrideAction, updateScheduleOverrideAction } from './actions'
import { useToast } from '@/components/ui/ToastProvider'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import DatePicker from '@/components/ui/DatePicker'
import TimeRangePicker from '@/components/ui/TimeRangePicker'
import { format, parseISO, startOfWeek, addDays } from 'date-fns'

interface Props {
  initialWeekly: WeeklyScheduleDay[]
  initialSalons: SalonResponse[]
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

export default function HorariosClient({ initialWeekly, initialSalons, initialOverrides, role }: Props) {
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const { toast } = useToast()
  const { confirm } = useConfirm()

  const [weekly, setWeekly] = useState<WeeklyScheduleDay[]>(initialWeekly)
  const [salons] = useState<SalonResponse[]>(initialSalons)
  const [selectedSalonId, setSelectedSalonId] = useState<string>('')
  const [loadingWeekly, setLoadingWeekly] = useState(false)
  const [overrides, setOverrides] = useState<ScheduleOverrideResponse[]>(initialOverrides)
  const [loadingOverrides, setLoadingOverrides] = useState(false)

  // Create override modal state
  const [showOverride, setShowOverride] = useState(false)
  const [overrideSalonId, setOverrideSalonId] = useState<string>('')
  const [overrideDate, setOverrideDate] = useState<string>('')
  const [overrideClosed, setOverrideClosed] = useState(false)
  const [overrideOpenTime, setOverrideOpenTime] = useState<string>('')
  const [overrideCloseTime, setOverrideCloseTime] = useState<string>('')
  const [overrideReason, setOverrideReason] = useState<string>('')
  const [overrideError, setOverrideError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Edit override modal state
  const [editingOverride, setEditingOverride] = useState<ScheduleOverrideResponse | null>(null)
  const [editOpenTime, setEditOpenTime] = useState<string>('')
  const [editCloseTime, setEditCloseTime] = useState<string>('')
  const [editReason, setEditReason] = useState<string>('')
  const [editError, setEditError] = useState<string | null>(null)
  const [isEditPending, startEditTransition] = useTransition()

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
    const [resOverrides, resWeekly] = await Promise.all([
      getScheduleOverridesAction(resolvedSalonId),
      getWeeklyScheduleAction(resolvedSalonId),
    ])
    if (resOverrides.ok && resOverrides.overrides) setOverrides(resOverrides.overrides)
    if (resWeekly.ok && resWeekly.weekly) setWeekly(resWeekly.weekly)

    startTransition(() => {
      toast('Horario especial registrado exitosamente', 'success')
      closeOverrideModal()
    })
  }

  const isOverrideIncomplete =
    !overrideDate ||
    (isSuperAdmin && !overrideSalonId) ||
    (!overrideClosed && (!overrideOpenTime || !overrideCloseTime))

  function openEditModal(o: ScheduleOverrideResponse) {
    setEditingOverride(o)
    setEditOpenTime(o.openTime ?? '')
    setEditCloseTime(o.closeTime ?? '')
    setEditReason(o.reason ?? '')
    setEditError(null)
  }

  function closeEditModal() {
    setEditingOverride(null)
    setEditError(null)
  }

  async function handleUpdateOverride(e: React.FormEvent) {
    e.preventDefault()
    if (!editingOverride) return
    setEditError(null)

    if (!editingOverride.closed && (!editOpenTime || !editCloseTime)) {
      setEditError('Debes indicar la hora de apertura y cierre')
      return
    }

    const payload = {
      ...(!editingOverride.closed ? { openTime: editOpenTime, closeTime: editCloseTime } : {}),
      ...(editReason ? { reason: editReason } : {}),
    }

    const salonId = isSuperAdmin && selectedSalonId ? Number(selectedSalonId) : undefined
    const res = await updateScheduleOverrideAction(editingOverride.id, payload, salonId)

    if (!res.ok) {
      setEditError(res.error ?? 'Error al actualizar el horario especial')
      return
    }

    if (res.updated) {
      setOverrides(prev => prev.map(o => o.id === res.updated!.id ? res.updated! : o))
    }

    const resWeekly = await getWeeklyScheduleAction(salonId)
    if (resWeekly.ok && resWeekly.weekly) setWeekly(resWeekly.weekly)

    startEditTransition(() => {
      toast('Horario especial actualizado', 'success')
      closeEditModal()
    })
  }

  async function handleDeleteOverride(id: number) {
    const ok = await confirm({
      title: '¿Eliminar horario especial?',
      message: 'Esta acción no se puede deshacer.',
      confirmLabel: 'Sí, eliminar',
      variant: 'danger',
    })
    if (!ok) return

    const salonId = isSuperAdmin && selectedSalonId ? Number(selectedSalonId) : undefined
    const res = await deleteScheduleOverrideAction(id, salonId)
    if (!res.ok) {
      toast(res.error ?? 'Error al eliminar', 'error')
      return
    }
    setOverrides(prev => prev.filter(o => o.id !== id))

    const resWeekly = await getWeeklyScheduleAction(salonId)
    if (resWeekly.ok && resWeekly.weekly) setWeekly(resWeekly.weekly)

    toast('Horario especial eliminado', 'success')
  }

  const sortedWeekly = DAY_ORDER.map(day =>
    weekly.find(d => d.dayOfWeek === day) ?? { dayOfWeek: day, blocks: [] }
  )

  const weekDates = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 })
    return {
      MONDAY:    format(addDays(start, 0), 'yyyy-MM-dd'),
      TUESDAY:   format(addDays(start, 1), 'yyyy-MM-dd'),
      WEDNESDAY: format(addDays(start, 2), 'yyyy-MM-dd'),
      THURSDAY:  format(addDays(start, 3), 'yyyy-MM-dd'),
      FRIDAY:    format(addDays(start, 4), 'yyyy-MM-dd'),
      SATURDAY:  format(addDays(start, 5), 'yyyy-MM-dd'),
      SUNDAY:    format(addDays(start, 6), 'yyyy-MM-dd'),
    }
  }, [])

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
            const dayDate = weekDates[day.dayOfWeek as keyof typeof weekDates]
            const dayOverrides = overrides.filter(o => o.date === dayDate)
            const closedOverride = dayOverrides.find(o => o.closed)
            const openOverrides = dayOverrides.filter(o => !o.closed)
            const hasRegularBlocks = day.blocks.length > 0
            const hasOverrides = openOverrides.length > 0
            const isOpen = hasOverrides || hasRegularBlocks
            const isForcedClosed = !!closedOverride
            const totalBlocks = hasOverrides ? openOverrides.length : day.blocks.length

            return (
              <div
                key={day.dayOfWeek}
                className={`rounded-2xl p-4 flex flex-col min-h-[160px] border shadow-sm smooth-transition
                  ${isForcedClosed
                    ? 'bg-rose-50 border-rose-200'
                    : isOpen
                    ? 'bg-white border-slate-200 hover:border-slate-300'
                    : 'bg-slate-50 border-slate-200'}`}
              >
                {/* Cabecera del día */}
                <div className={`border-b pb-2 mb-3 text-center ${isForcedClosed ? 'border-rose-200' : 'border-slate-200'}`}>
                  <span className={`text-xs font-black uppercase tracking-wider
                    ${isForcedClosed ? 'text-rose-500' : isOpen ? 'text-slate-700' : 'text-slate-400'}`}>
                    {DAY_LABELS[day.dayOfWeek]}
                  </span>
                </div>

                {/* Contenido */}
                <div className="flex-1 flex flex-col gap-2 justify-center">
                  {isForcedClosed ? (
                    /* Día cerrado por override especial */
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-xs font-bold text-rose-500 italic">Cerrado especial</span>
                      {closedOverride.reason && (
                        <p className="text-[10px] text-rose-400 text-center w-full truncate px-1">{closedOverride.reason}</p>
                      )}
                      {role !== 'USER' && (
                        <button
                          onClick={() => handleDeleteOverride(closedOverride.id)}
                          className="mt-1 p-1 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-100 smooth-transition cursor-pointer"
                          title="Eliminar horario especial"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Bloques regulares (verde) — solo si no hay override para este día */}
                      {openOverrides.length === 0 && day.blocks.map(block => (
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
                      ))}

                      {/* Bloques especiales (morado) — reemplazan los regulares */}
                      {openOverrides.map(o => (
                        <div
                          key={`ov-${o.id}`}
                          onClick={() => role !== 'USER' && openEditModal(o)}
                          className={`bg-violet-50 border border-violet-200 rounded-xl px-2 py-2 relative group
                            ${role !== 'USER' ? 'cursor-pointer hover:bg-violet-100' : ''} smooth-transition`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1 flex-1 min-w-0">
                              <Clock className="w-3 h-3 text-violet-600 shrink-0" />
                              <span className="text-[11px] font-black text-violet-700 truncate">
                                {formatTime(o.openTime ?? '')} – {formatTime(o.closeTime ?? '')}
                              </span>
                            </div>
                            {role !== 'USER' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteOverride(o.id) }}
                                className="shrink-0 p-0.5 rounded text-violet-300 hover:text-rose-600 smooth-transition opacity-0 group-hover:opacity-100 cursor-pointer"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          {o.reason && (
                            <p className="text-[10px] text-violet-400 mt-0.5 truncate">{o.reason}</p>
                          )}
                        </div>
                      ))}

                      {/* Sin horario */}
                      {!isOpen && (
                        <div className="flex items-center justify-center py-4">
                          <span className="text-xs font-bold text-slate-400 italic">Cerrado</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Contador de bloques */}
                {isOpen && !isForcedClosed && (
                  <p className="text-[10px] font-bold text-center mt-2 pt-2 border-t border-slate-100">
                    <span className="text-slate-400">{totalBlocks} {totalBlocks === 1 ? 'jornada' : 'jornadas'}</span>
                    {openOverrides.length > 0 && (
                      <span className="ml-1 text-violet-500">· {openOverrides.length} especial{openOverrides.length > 1 ? 'es' : ''}</span>
                    )}
                  </p>
                )}
              </div>
            )
          })}
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

      {/* Modal Editar Horario Especial */}
      {editingOverride && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 mx-4 relative">
            <div className="flex items-center justify-between mb-5 border-b border-slate-200 pb-3">
              <h2 className="text-lg font-black text-slate-950 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-brand-primary" />
                <span>Editar Horario Especial</span>
              </h2>
              <button
                onClick={closeEditModal}
                className="text-slate-500 hover:text-slate-800 rounded-lg p-1 hover:bg-slate-100 smooth-transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Fecha (solo lectura) */}
            <div className="mb-4 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-xs font-bold text-slate-700">
                {format(parseISO(editingOverride.date), 'dd/MM/yyyy')}
              </span>
              <span className="ml-auto text-[11px] font-bold text-slate-400 italic">No editable</span>
            </div>

            <form onSubmit={handleUpdateOverride} className="space-y-4">
              {/* Horario — solo si el override no era cerrado */}
              {!editingOverride.closed ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span>Horario *</span>
                  </label>
                  <TimeRangePicker
                    startTime={editOpenTime}
                    endTime={editCloseTime}
                    onStartChange={setEditOpenTime}
                    onEndChange={setEditCloseTime}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                  <span className="text-xs font-bold text-rose-700">Día cerrado — solo puedes editar el motivo</span>
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
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="Ej. Ajuste de horario"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-xs font-semibold text-slate-950 focus:outline-none focus:ring-2 focus:ring-brand-primary-500/20 focus:border-brand-primary-600 smooth-transition shadow-sm"
                />
              </div>

              {editError && (
                <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                  {editError}
                </p>
              )}

              <div className="flex gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100 smooth-transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isEditPending || (!editingOverride.closed && (!editOpenTime || !editCloseTime))}
                  className="flex-1 rounded-xl bg-brand-primary px-4 py-3 text-xs font-bold text-white hover:bg-brand-primary-dark disabled:opacity-50 disabled:cursor-not-allowed smooth-transition shadow-sm"
                >
                  {isEditPending ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
