'use client'

import { useState, useEffect } from 'react'
import { 
  Clock, 
  Calendar, 
  Scissors, 
  Sparkles, 
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { Schedule, SalonServiceResponse } from '@/lib/types'
import { getAvailableSlotsAction } from '../citas/actions'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  schedules: Schedule[]
  services: SalonServiceResponse[]
}

// Mapeo de días de inglés a español
const dayNamesMap: { [key: string]: string } = {
  MONDAY: 'Lunes',
  TUESDAY: 'Martes',
  WEDNESDAY: 'Miércoles',
  THURSDAY: 'Jueves',
  FRIDAY: 'Viernes',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
}

const dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

export default function HorariosClient({ schedules, services }: Props) {
  // Ordenar horarios según orden de la semana
  const sortedSchedules = [...schedules].sort((a, b) => {
    return dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek)
  })

  // Estados del Simulador de Disponibilidad
  const [selectedServiceId, setSelectedServiceId] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  // Consulta de slots
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

  // Limpiar simulador
  function handleClear() {
    setSelectedServiceId('')
    setSelectedDate('')
    setAvailableSlots([])
    setSlotsError(null)
    setSearched(false)
  }

  // Limpiar segundos de la hora ("09:00:00" -> "09:00")
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '—'
    const parts = timeStr.split(':')
    if (parts.length >= 2) return `${parts[0]}:${parts[1]}`
    return timeStr
  }

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Horarios</h1>
        <p className="text-slate-700 mt-1 text-sm font-medium">Configuración de disponibilidad comercial y turnos del salón.</p>
      </div>

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lado Izquierdo: Horario Comercial (2/3 de ancho) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-4">
            <Clock className="w-5.5 h-5.5 text-brand-primary-600" />
            <h2 className="text-xl font-extrabold text-slate-950">Horarios de Apertura Semanal</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sortedSchedules.map((sched) => {
              const dayEs = dayNamesMap[sched.dayOfWeek] || sched.dayOfWeek
              const open = formatTime(sched.openTime)
              const close = formatTime(sched.closeTime)

              return (
                <div 
                  key={sched.id} 
                  className="glass-card rounded-2xl p-5 border border-slate-300 hover:border-slate-400 smooth-transition flex justify-between items-center group relative overflow-hidden bg-white shadow-md"
                >
                  <div className="space-y-1">
                    <span className="text-base font-extrabold text-slate-950">{dayEs}</span>
                    <p className="text-xs text-slate-500 font-medium">Jornada laboral establecida</p>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl font-black text-xs text-slate-900 shadow-inner">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span>{open} - {close}</span>
                  </div>
                </div>
              )
            })}
            
            {sortedSchedules.length === 0 && (
              <div className="col-span-full py-16 text-center glass-card border-dashed border-2 border-slate-300 rounded-2xl">
                <Clock className="w-14 h-14 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-800 text-sm font-bold">No hay horarios comerciales configurados</p>
              </div>
            )}
          </div>
        </div>

        {/* Lado Derecho: Simulador de Disponibilidad */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-4">
            <Sparkles className="w-5.5 h-5.5 text-brand-accent-600 animate-float" />
            <h2 className="text-lg font-extrabold text-slate-950">Consulta de Turnos Libres</h2>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-slate-300 space-y-5 bg-white shadow-lg">
            <p className="text-xs text-slate-700 font-semibold leading-relaxed">
              Verifica rápidamente los bloques horarios libres para un servicio y día específico antes de crear la cita.
            </p>

            {/* Inputs de Consulta */}
            <div className="space-y-4">
              {/* Servicio */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                  <Scissors className="w-4 h-4 text-slate-500" />
                  <span>Servicio</span>
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-xs font-bold text-slate-950 focus:outline-none focus:ring-2 focus:ring-brand-primary-500/20 focus:border-brand-primary-600 smooth-transition cursor-pointer shadow-sm"
                >
                  <option value="">Selecciona un servicio</option>
                  {services.filter(s => s.active).map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.durationMins} min)</option>
                  ))}
                </select>
              </div>

              {/* Fecha */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>Fecha de Consulta</span>
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-xs font-bold text-slate-950 focus:outline-none focus:ring-2 focus:ring-brand-primary-500/20 focus:border-brand-primary-600 smooth-transition shadow-sm"
                />
              </div>
            </div>

            {/* Resultados del Simulador */}
            {searched && (
              <div className="space-y-3.5 pt-3.5 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900">Resultado</span>
                  <button 
                    onClick={handleClear}
                    className="text-xs text-brand-primary-600 hover:text-brand-primary-800 font-extrabold transition-colors underline"
                  >
                    Limpiar
                  </button>
                </div>

                {loadingSlots ? (
                  <div className="flex items-center gap-2 py-4 text-slate-600 text-xs justify-center bg-slate-50 border border-slate-200 rounded-xl shadow-inner">
                    <svg className="animate-spin h-4 w-4 text-brand-primary-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="font-bold">Consultando disponibilidad...</span>
                  </div>
                ) : slotsError ? (
                  <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-start gap-2 animate-bounce">
                    <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-rose-700 font-bold">{slotsError}</p>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 border border-slate-200 rounded-xl shadow-inner">
                    <p className="text-xs text-slate-500 font-bold italic">No hay disponibilidad para esta fecha.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <p className="text-xs text-white font-black flex items-center gap-1.5 bg-emerald-600 px-3 py-1 rounded-full w-fit shadow-md shadow-emerald-600/10">
                      <CheckCircle className="w-4 h-4 text-white" />
                      <span>{availableSlots.length} turnos libres</span>
                    </p>
                    <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-100/50 shadow-inner">
                      {availableSlots.map(slot => (
                        <span
                          key={slot}
                          className="px-2 py-1.5 rounded-lg text-xs font-black text-center bg-white border border-slate-350 text-slate-950 shadow-sm"
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
      </div>
    </div>
  )
}
