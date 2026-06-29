'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  CalendarRange, 
  Users, 
  Scissors, 
  Plus, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  HelpCircle,
  TrendingUp,
  ChevronRight,
  Calendar,
  Sparkles
} from 'lucide-react'
import { AppointmentResponse, ClientResponse, SalonServiceResponse } from '@/lib/types'
import { format, isToday, parseISO, isAfter, startOfToday } from 'date-fns'
import { es } from 'date-fns/locale'

interface DashboardClientProps {
  initialAppointments: AppointmentResponse[]
  initialClients: ClientResponse[]
  initialServices: SalonServiceResponse[]
}

export default function DashboardClient({
  initialAppointments,
  initialClients,
  initialServices
}: DashboardClientProps) {
  const [appointments] = useState<AppointmentResponse[]>(initialAppointments)
  const [clients] = useState<ClientResponse[]>(initialClients)
  const [services] = useState<SalonServiceResponse[]>(initialServices)

  // Filtrados
  const today = startOfToday()
  const todayApps = appointments.filter(app => isToday(parseISO(app.startTime)))
  const upcomingApps = appointments.filter(app => {
    const date = parseISO(app.startTime)
    return isAfter(date, today) && !isToday(date)
  })

  // Contadores
  const activeServices = services.filter(s => s.active).length

  // Helper para buscar datos relacionales
  const getClient = (clientId: number) => clients.find(c => c.id === clientId)
  const getService = (serviceId: number) => services.find(s => s.id === serviceId)

  // Formateador de precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(price)
  }

  // Mapeo de estados de cita - Más coloridos y alto contraste
  const statusConfig = {
    PENDING: { label: 'Pendiente', bg: 'bg-amber-100 text-amber-900 border-amber-300 font-bold', icon: HelpCircle },
    CONFIRMED: { label: 'Confirmada', bg: 'bg-emerald-100 text-emerald-950 border-emerald-300 font-bold', icon: CheckCircle2 },
    COMPLETED: { label: 'Completada', bg: 'bg-sky-100 text-sky-950 border-sky-300 font-bold', icon: CheckCircle2 },
    CANCELLED: { label: 'Cancelada', bg: 'bg-rose-100 text-rose-950 border-rose-300 font-bold', icon: XCircle },
  }

  return (
    <div className="space-y-8">
      {/* Saludo Principal */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-4xl font-extrabold italic text-slate-950 tracking-tight flex items-center gap-2"
          >
            Panel de Control <Sparkles className="w-6.5 h-6.5 text-brand-primary animate-float" />
          </h1>
          <p className="text-slate-500 mt-1 font-semibold text-sm">
            Resumen general del día de hoy, {format(new Date(), 'EEEE d \'de\' MMMM', { locale: es })}.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/citas"
            className="flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-sm font-bold text-white hover:bg-brand-primary-hover smooth-transition shadow-md shadow-brand-primary/10"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Nueva Cita</span>
          </Link>
        </div>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Citas de Hoy */}
        <div className="bg-white border border-[#E5E7F2] shadow-[0_10px_30px_rgba(15,23,42,0.03)] rounded-2xl p-6 relative overflow-hidden group hover:scale-[1.02] hover:shadow-lg smooth-transition">
          <div className="absolute top-0 left-0 w-2.5 h-full bg-brand-primary" />
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#667085] uppercase tracking-wider block">Citas Programadas Hoy</span>
              <span className="text-4xl font-black text-slate-950 block">{todayApps.length}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-brand-primary/10 text-brand-primary shadow-sm shadow-brand-primary/5">
              <CalendarRange className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-brand-primary font-bold">
            <TrendingUp className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>Turnos del día en agenda</span>
          </div>
        </div>

        {/* Clientes Registrados */}
        <div className="bg-white border border-[#E5E7F2] shadow-[0_10px_30px_rgba(15,23,42,0.03)] rounded-2xl p-6 relative overflow-hidden group hover:scale-[1.02] hover:shadow-lg smooth-transition">
          <div className="absolute top-0 left-0 w-2.5 h-full bg-brand-secondary" />
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#667085] uppercase tracking-wider block">Total Clientes</span>
              <span className="text-4xl font-black text-slate-950 block">{clients.length}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-brand-secondary/10 text-brand-secondary shadow-sm shadow-brand-secondary/5">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs">
            <Link href="/clientes" className="text-brand-secondary hover:text-brand-secondary/80 font-bold flex items-center gap-0.5 smooth-transition">
              <span>Gestionar base de datos</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Servicios Activos */}
        <div className="bg-white border border-[#E5E7F2] shadow-[0_10px_30px_rgba(15,23,42,0.03)] rounded-2xl p-6 relative overflow-hidden group hover:scale-[1.02] hover:shadow-lg smooth-transition">
          <div className="absolute top-0 left-0 w-2.5 h-full bg-brand-premium" />
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#667085] uppercase tracking-wider block">Servicios Activos</span>
              <span className="text-4xl font-black text-slate-950 block">{activeServices}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-brand-premium/15 text-brand-premium shadow-sm shadow-brand-premium/5">
              <Scissors className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-brand-premium font-bold">
            <span>Servicios listos para cotizar</span>
          </div>
        </div>
      </div>

      {/* Grid de Contenido Principal y Accesos Rápidos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Panel Izquierdo: Agenda de Hoy (Ancho 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h2 className="text-xl font-extrabold text-slate-950 flex items-center gap-2">
              <Clock className="w-5.5 h-5.5 text-brand-primary-600" />
              <span>Agenda de Citas de Hoy</span>
            </h2>
            <span className="text-xs bg-slate-200 text-slate-800 px-3 py-1 rounded-full font-bold">
              {todayApps.length} citas
            </span>
          </div>

          {todayApps.length === 0 ? (
            <div className="glass-card rounded-2xl p-10 text-center border-dashed border-2 border-slate-300">
              <Calendar className="w-14 h-14 text-slate-400 mx-auto mb-3 animate-pulse" />
              <p className="text-slate-800 font-bold text-base">No hay citas programadas para hoy</p>
              <p className="text-slate-500 text-xs mt-1">¡Los clientes pueden reservar ingresando citas en el sistema!</p>
              <Link
                href="/citas"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 text-xs font-bold smooth-transition shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Programar cita</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {todayApps.map((app) => {
                const client = getClient(app.clientId)
                const service = getService(app.serviceId)
                const status = statusConfig[app.status] || statusConfig.PENDING
                const StatusIcon = status.icon

                return (
                  <div
                    key={app.id}
                    className="glass-card rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md hover:border-slate-400 smooth-transition"
                  >
                    <div className="flex items-start gap-4">
                      {/* Bloque de hora */}
                      <div className="flex flex-col items-center justify-center bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 min-w-[80px] text-center shadow-inner">
                        <span className="text-sm font-black text-slate-900">
                          {format(parseISO(app.startTime), 'HH:mm')}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-0.5 font-bold">
                          {format(parseISO(app.endTime), 'HH:mm')}
                        </span>
                      </div>
                      
                      {/* Detalles del Cliente y Servicio */}
                      <div className="space-y-1">
                        <h3 className="text-sm font-extrabold text-slate-950">
                          {client?.fullName ?? 'Cliente Registrado'}
                        </h3>
                        <p className="text-xs text-slate-700 flex items-center gap-1.5 font-medium">
                          <Scissors className="w-3.5 h-3.5 text-brand-accent-600" />
                          <span>{service?.name ?? 'Servicio'} ({service?.durationMins ?? '0'} min)</span>
                        </p>
                        {app.notes && (
                          <p className="text-[11px] text-slate-600 italic max-w-xs truncate">
                            Nota: &ldquo;{app.notes}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Estado y Precio */}
                    <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 pt-2 sm:pt-0">
                      <div className="text-right hidden sm:block">
                        <span className="text-sm font-black text-slate-950">
                          {formatPrice(service?.price ?? 0)}
                        </span>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${status.bg}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span>{status.label}</span>
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Panel Derecho: Accesos Rápidos y Próximas Citas (Ancho 1/3) */}
        <div className="space-y-8">
          {/* Accesos Rápidos */}
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-slate-950">Acceso Rápido</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/citas"
                className="glass-card rounded-xl p-5 flex flex-col items-center justify-center text-center gap-2 hover:bg-slate-50 border border-slate-200 smooth-transition hover:border-brand-primary-400 group"
              >
                <CalendarRange className="w-7 h-7 text-brand-primary-600 group-hover:scale-110 smooth-transition" />
                <span className="text-xs font-bold text-slate-800">Agenda Citas</span>
              </Link>
              <Link
                href="/clientes"
                className="glass-card rounded-xl p-5 flex flex-col items-center justify-center text-center gap-2 hover:bg-slate-50 border border-slate-200 smooth-transition hover:border-brand-accent-500 group"
              >
                <Users className="w-7 h-7 text-brand-accent-600 group-hover:scale-110 smooth-transition" />
                <span className="text-xs font-bold text-slate-800">Clientes</span>
              </Link>
              <Link
                href="/horarios"
                className="glass-card rounded-xl p-5 flex flex-col items-center justify-center text-center gap-2 hover:bg-slate-50 border border-slate-200 smooth-transition hover:border-slate-400 group"
              >
                <Clock className="w-7 h-7 text-slate-700 group-hover:scale-110 smooth-transition" />
                <span className="text-xs font-bold text-slate-800">Horarios</span>
              </Link>
              <div
                className="glass-card rounded-xl p-5 flex flex-col items-center justify-center text-center gap-2 opacity-40 cursor-not-allowed border border-slate-200"
              >
                <Scissors className="w-7 h-7 text-slate-500" />
                <span className="text-xs font-bold text-slate-500">Servicios</span>
              </div>
            </div>
          </div>

          {/* Próximos días en agenda */}
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-slate-950 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-accent-600" />
              <span>Próximas Citas ({upcomingApps.length})</span>
            </h2>
            <div className="glass-card rounded-2xl p-4 divide-y divide-slate-200 max-h-[300px] overflow-y-auto">
              {upcomingApps.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6 font-medium">No hay citas en los próximos días</p>
              ) : (
                upcomingApps.slice(0, 5).map((app) => {
                  const client = getClient(app.clientId)
                  const service = getService(app.serviceId)
                  return (
                    <div key={app.id} className="py-3.5 first:pt-0 last:pb-0 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-extrabold text-slate-900">{client?.fullName ?? 'Cliente'}</p>
                        <p className="text-slate-600 mt-0.5 font-medium">{service?.name ?? 'Servicio'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-800">
                          {format(parseISO(app.startTime), 'd MMM', { locale: es })}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-bold">
                          {format(parseISO(app.startTime), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
