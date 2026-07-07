'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  Calendar,
  List,
  Search,
  Plus,
  Clock,
  User,
  Scissors,
  FileText,
  X,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Phone,
  Building2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { AppointmentResponse, ClientResponse, SalonResponse, SalonServiceResponse, UserRole, WeeklyDay } from '@/lib/types'
import {
  createAppointmentAction,
  cancelAppointmentAction,
  getClientsAction,
  getServicesAction,
  getSalonsAction,
  getWeeklyAppointmentsAction,
} from './actions'
import { useToast } from '@/components/ui/ToastProvider'
import DatePicker from '@/components/ui/DatePicker'
import TimeRangePicker from '@/components/ui/TimeRangePicker'
import { format, parseISO, isSameDay, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  initialAppointments: AppointmentResponse[]
  initialClients: ClientResponse[]
  initialServices: SalonServiceResponse[]
  initialSalons: SalonResponse[]
  role: UserRole
}

export default function CitasClient({
  initialAppointments,
  initialClients,
  initialServices,
  initialSalons,
  role,
}: Props) {
  const { toast } = useToast()
  const isSuperAdmin = role === 'SUPER_ADMIN'

  const [appointments, setAppointments] = useState<AppointmentResponse[]>(initialAppointments)
  const [clients, setClients] = useState<ClientResponse[]>(initialClients)
  const [services, setServices] = useState<SalonServiceResponse[]>(initialServices)
  const [salons, setSalons] = useState<SalonResponse[]>(initialSalons)

  const [activeTab, setActiveTab] = useState<'lista' | 'agenda'>('lista')
  const [weeklyDays, setWeeklyDays] = useState<WeeklyDay[]>([])
  const [weekLoading, setWeekLoading] = useState(false)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [agendaSalonId, setAgendaSalonId] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [loadingModalData, setLoadingModalData] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [selectedSalonId, setSelectedSalonId] = useState<string>('')
  const [selectedServiceId, setSelectedServiceId] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedStartTime, setSelectedStartTime] = useState<string>('')
  const [selectedEndTime, setSelectedEndTime] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  const [loadingServices, setLoadingServices] = useState(false)

  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!isSuperAdmin || !selectedSalonId) return

    setSelectedServiceId('')
    setServices([])
    setLoadingServices(true)

    getServicesAction(Number(selectedSalonId)).then(res => {
      if (res.ok && res.services) {
        setServices(res.services)
      } else {
        toast(res.error ?? 'Error al cargar servicios', 'error')
      }
      setLoadingServices(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSalonId])

  useEffect(() => {
    if (activeTab !== 'agenda') return
    if (isSuperAdmin && !agendaSalonId) return

    const startDate = format(currentWeekStart, 'yyyy-MM-dd')
    const endDate = format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const params = {
      startDate,
      endDate,
      ...(isSuperAdmin ? { salonId: Number(agendaSalonId) } : {}),
    }

    setWeekLoading(true)
    getWeeklyAppointmentsAction(params).then(res => {
      if (res.ok && res.days) {
        setWeeklyDays(res.days)
      } else {
        toast(res.error ?? 'Error al cargar la agenda semanal', 'error')
      }
      setWeekLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentWeekStart, agendaSalonId])

  async function openModal() {
    setShowModal(true)
    setLoadingModalData(true)

    const nullPromise = Promise.resolve(null) as Promise<null>
    const [clientsRes, salonsRes] = await Promise.allSettled([
      getClientsAction(),
      isSuperAdmin ? getSalonsAction() : nullPromise,
    ])

    if (clientsRes.status === 'fulfilled' && clientsRes.value?.ok && clientsRes.value.clients) {
      setClients(clientsRes.value.clients)
    } else {
      const error = clientsRes.status === 'fulfilled'
        ? clientsRes.value?.error
        : 'Error de red al cargar clientes'
      toast(error ?? 'Error al cargar clientes', 'error')
    }

    if (isSuperAdmin) {
      if (salonsRes.status === 'fulfilled' && salonsRes.value?.ok && salonsRes.value.salons) {
        setSalons(salonsRes.value.salons)
      } else if (salonsRes.status === 'fulfilled' && salonsRes.value) {
        toast(salonsRes.value.error ?? 'Error al cargar negocios', 'error')
      } else if (salonsRes.status === 'rejected') {
        toast('Error de red al cargar negocios', 'error')
      }
    } else {
      const servicesRes = await getServicesAction()
      if (servicesRes.ok && servicesRes.services) {
        setServices(servicesRes.services)
      } else {
        toast(servicesRes.error ?? 'Error al cargar servicios', 'error')
      }
    }

    setLoadingModalData(false)
  }

  function closeModal() {
    setShowModal(false)
    setSelectedClientId('')
    setSelectedSalonId('')
    setSelectedServiceId('')
    setSelectedDate('')
    setSelectedStartTime('')
    setSelectedEndTime('')
    setNotes('')
    if (isSuperAdmin) setServices([])
  }

  async function handleCreateAppointment(e: React.FormEvent) {
    e.preventDefault()

    if (selectedEndTime <= selectedStartTime) {
      toast('La hora de fin debe ser posterior a la hora de inicio', 'error')
      return
    }

    const client = clients.find(c => c.id === Number(selectedClientId))
    const service = services.find(s => s.id === Number(selectedServiceId))

    if (!client || !service) {
      toast('Cliente o servicio no válidos.', 'error')
      return
    }

    const result = await createAppointmentAction({
      clientId: client.id,
      serviceId: service.id,
      whatsappNumber: client.phone,
      startTime: `${selectedDate}T${selectedStartTime}:00`,
      endTime: `${selectedDate}T${selectedEndTime}:00`,
      notes: notes || undefined,
      ...(isSuperAdmin && selectedSalonId ? { salonId: Number(selectedSalonId) } : {}),
    })

    if (!result.ok) {
      toast(result.error ?? 'Error al agendar la cita', 'error')
      return
    }

    if (result.appointment) {
      const newApp = result.appointment
      startTransition(() => {
        setAppointments(prev => [newApp, ...prev])
      })
      toast('¡Cita agendada exitosamente!', 'success')
      closeModal()
    }
  }

  async function handleCancelAppointment(id: number) {
    if (!confirm('¿Estás seguro de que deseas cancelar esta cita?')) return

    const res = await cancelAppointmentAction(id)
    if (res.ok) {
      startTransition(() => {
        setAppointments(prev =>
          prev.map(app => app.id === id ? { ...app, status: 'CANCELLED' } : app)
        )
      })
    } else {
      toast(res.error ?? 'Error al cancelar la cita', 'error')
    }
  }

  const getClient = (id: number) => clients.find(c => c.id === id)
  const getService = (id: number) => services.find(s => s.id === id)

  const filteredAppointments = appointments.filter(app => {
    const client = getClient(app.clientId)
    const matchesSearch =
      client?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client?.phone.includes(searchTerm)
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const sortedAppointments = [...filteredAppointments].sort((a, b) =>
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  )

  const statusConfig = {
    PENDING:   { label: 'Pendiente',  badge: 'bg-amber-50 text-amber-700 border-amber-200',        icon: HelpCircle,   dot: 'bg-amber-400',   row: 'border-l-amber-400',   bg: 'bg-amber-50 text-amber-700 border-amber-200'   },
    CONFIRMED: { label: 'Confirmada', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',  icon: CheckCircle2, dot: 'bg-emerald-500', row: 'border-l-emerald-500', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    COMPLETED: { label: 'Completada', badge: 'bg-sky-50 text-sky-700 border-sky-200',              icon: CheckCircle2, dot: 'bg-sky-500',     row: 'border-l-sky-500',     bg: 'bg-sky-50 text-sky-700 border-sky-200'     },
    CANCELLED: { label: 'Cancelada',  badge: 'bg-slate-100 text-slate-500 border-slate-200',       icon: XCircle,      dot: 'bg-slate-400',   row: 'border-l-slate-300',   bg: 'bg-slate-100 text-slate-500 border-slate-200'  },
  }

  const isFormIncomplete =
    !selectedClientId ||
    (isSuperAdmin && !selectedSalonId) ||
    !selectedServiceId ||
    !selectedDate ||
    !selectedStartTime ||
    !selectedEndTime

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">Citas</h1>
          <p className="text-slate-700 mt-1 text-sm font-medium">Gestiona la agenda, turnos y estados de citas.</p>
        </div>
        <button
          onClick={openModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-sm font-bold text-white hover:bg-brand-primary-dark smooth-transition shadow-md shadow-brand-primary/10 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Programar Turno</span>
        </button>
      </div>

      {/* Pestañas & Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex bg-slate-200 p-1.5 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('lista')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg smooth-transition ${activeTab === 'lista' ? 'bg-slate-950 text-white shadow-md' : 'text-slate-700 hover:text-slate-950'}`}
          >
            <List className="w-4 h-4" />
            <span>Lista</span>
          </button>
          <button
            onClick={() => setActiveTab('agenda')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg smooth-transition ${activeTab === 'agenda' ? 'bg-slate-950 text-white shadow-md' : 'text-slate-700 hover:text-slate-950'}`}
          >
            <Calendar className="w-4 h-4" />
            <span>Agenda Semanal</span>
          </button>
        </div>

        {activeTab === 'lista' && (
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs font-medium rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent smooth-transition shadow-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-44"
            >
              <option value="ALL">Todos los estados</option>
              <option value="PENDING">Pendientes</option>
              <option value="CONFIRMED">Confirmadas</option>
              <option value="COMPLETED">Completadas</option>
              <option value="CANCELLED">Canceladas</option>
            </select>
          </div>
        )}

        {activeTab === 'agenda' && isSuperAdmin && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
            <select
              value={agendaSalonId}
              onChange={(e) => {
                setAgendaSalonId(e.target.value)
                setWeeklyDays([])
              }}
              className="w-full sm:w-56"
            >
              <option value="">Selecciona un negocio</option>
              {salons.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Vista Lista */}
      {activeTab === 'lista' ? (
        <div className="space-y-2">
          {/* Conteo */}
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">
            {sortedAppointments.length} {sortedAppointments.length === 1 ? 'cita' : 'citas'}
          </p>

          {sortedAppointments.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white py-24 text-center shadow-sm">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-700 text-sm font-bold">Sin citas que mostrar</p>
              <p className="text-slate-400 text-xs mt-1">Ajusta los filtros o programa una nueva cita.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
              {/* Header */}
              <div className="grid grid-cols-[2fr_1.5fr_1.6fr_1fr_1fr_auto] gap-4 items-center px-5 py-3 bg-slate-950">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cliente</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Servicio</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha / Hora</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notas</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Acción</span>
              </div>

              <div className="divide-y divide-slate-100">
                {sortedAppointments.map((app) => {
                  const client = getClient(app.clientId)
                  const service = getService(app.serviceId)
                  const status = statusConfig[app.status] || statusConfig.PENDING
                  const StatusIcon = status.icon
                  const initials = client?.fullName
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map(w => w[0].toUpperCase())
                    .join('') ?? '?'

                  return (
                    <div
                      key={app.id}
                      className={`grid grid-cols-[2fr_1.5fr_1.6fr_1fr_1fr_auto] gap-4 items-center px-5 py-4 border-l-[3px] smooth-transition
                        ${app.status === 'CANCELLED' ? 'opacity-60 bg-slate-50/60' : 'hover:bg-slate-50/80'}
                        ${status.row}`}
                    >
                      {/* Cliente */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-600 shrink-0 border border-slate-200">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-sm truncate leading-tight">{client?.fullName ?? '—'}</p>
                          <p className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 shrink-0" />
                            <span className="truncate">{client?.phone}</span>
                          </p>
                        </div>
                      </div>

                      {/* Servicio */}
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 text-xs truncate">{service?.name ?? '—'}</p>
                        {service?.durationMins && (
                          <p className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>{service.durationMins} min</span>
                          </p>
                        )}
                      </div>

                      {/* Fecha / Hora */}
                      <div>
                        <p className="font-bold text-slate-900 text-xs capitalize">
                          {format(parseISO(app.startTime), "EEE d 'de' MMM yyyy", { locale: es })}
                        </p>
                        <p className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>{format(parseISO(app.startTime), 'HH:mm')} – {format(parseISO(app.endTime), 'HH:mm')}</span>
                        </p>
                      </div>

                      {/* Estado */}
                      <div>
                        <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold ${status.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.dot}`} />
                          {status.label}
                        </span>
                      </div>

                      {/* Notas */}
                      <p className="text-slate-400 text-[11px] italic truncate">
                        {app.notes || '—'}
                      </p>

                      {/* Acción */}
                      <div className="flex justify-end">
                        {app.status !== 'CANCELLED' && app.status !== 'COMPLETED' ? (
                          <button
                            onClick={() => handleCancelAppointment(app.id)}
                            className="text-[11px] font-bold text-rose-600 hover:text-white border border-rose-200 hover:bg-rose-500 hover:border-rose-500 px-3 py-1.5 rounded-lg smooth-transition whitespace-nowrap"
                          >
                            Cancelar
                          </button>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Vista Agenda Semanal */
        <div className="space-y-4">
          {/* Navegación de semana */}
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm">
            <button
              onClick={() => setCurrentWeekStart(w => subWeeks(w, 1))}
              disabled={weekLoading}
              className="p-2 rounded-xl hover:bg-slate-100 smooth-transition disabled:opacity-50 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 text-slate-700" />
            </button>
            <span className="text-sm font-extrabold text-slate-900 capitalize">
              {format(currentWeekStart, "d 'de' MMMM", { locale: es })}
              {' — '}
              {format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), "d 'de' MMMM yyyy", { locale: es })}
            </span>
            <button
              onClick={() => setCurrentWeekStart(w => addWeeks(w, 1))}
              disabled={weekLoading}
              className="p-2 rounded-xl hover:bg-slate-100 smooth-transition disabled:opacity-50 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5 text-slate-700" />
            </button>
          </div>

          {isSuperAdmin && !agendaSalonId ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Building2 className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-700 text-sm font-bold">Selecciona un negocio para ver la agenda semanal</p>
              <p className="text-slate-400 text-xs mt-1">Usa el selector de negocio en la parte superior.</p>
            </div>
          ) : weekLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="glass-card rounded-2xl p-4 min-h-[380px] border border-slate-200 shadow-md animate-pulse bg-slate-50" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {weeklyDays.map(weekDay => {
                const dayDate = parseISO(weekDay.date)
                const isDayToday = isSameDay(dayDate, new Date())
                const dayApps = [...weekDay.appointments].sort((a, b) =>
                  a.startTime.localeCompare(b.startTime)
                )

                return (
                  <div
                    key={weekDay.date}
                    className={`glass-card rounded-2xl p-4 flex flex-col min-h-[380px] border shadow-md
                      ${isDayToday ? 'border-brand-primary-500 bg-brand-primary-100/20 ring-1 ring-brand-primary-500' : 'border-slate-350'}`}
                  >
                    <div className="border-b border-slate-200 pb-2 mb-3 text-center">
                      <span className={`text-xs uppercase tracking-wider block font-black
                        ${isDayToday ? 'text-brand-primary-600' : 'text-slate-500'}`}>
                        {format(dayDate, 'EEEE', { locale: es })}
                      </span>
                      <span className={`text-xl font-black mt-0.5 block
                        ${isDayToday ? 'text-brand-primary-800' : 'text-slate-900'}`}>
                        {format(dayDate, 'd MMM', { locale: es })}
                      </span>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto max-h-[420px] pr-1">
                      {dayApps.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-center py-10">
                          <span className="text-xs text-slate-500 font-bold italic">Sin turnos</span>
                        </div>
                      ) : (
                        dayApps.map(app => {
                          const service = getService(app.serviceId)
                          const status = statusConfig[app.status] || statusConfig.PENDING

                          return (
                            <div
                              key={app.id}
                              className={`p-3 rounded-xl border text-[11px] shadow-sm flex flex-col gap-2 smooth-transition hover:border-slate-400
                                ${app.status === 'CANCELLED' ? 'opacity-60 bg-slate-100 border-slate-200' : 'bg-white border-slate-300'}`}
                            >
                              <div className="flex justify-between items-start gap-1">
                                <span className="font-black text-slate-900 text-[12px]">
                                  {format(parseISO(app.startTime), 'HH:mm')}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${status.bg}`}>
                                  {status.label}
                                </span>
                              </div>
                              <div>
                                <p className="font-extrabold text-slate-950 truncate text-[12px]">{app.client.fullName}</p>
                                <p className="text-slate-700 font-bold truncate text-[11px]">{service?.name}</p>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Nueva Cita */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 mx-4 relative">
            {/* Cabecera */}
            <div className="flex items-center justify-between mb-5 border-b border-slate-200 pb-3">
              <h2 className="text-lg font-black text-slate-950 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-primary-600" />
                <span>Programar Cita</span>
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-500 hover:text-slate-800 rounded-lg p-1 hover:bg-slate-100 smooth-transition"
              >
                <X className="w-5.5 h-5.5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              {/* Cliente */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-500" />
                  <span>Cliente *</span>
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  disabled={loadingModalData}
                  className="w-full"
                  required
                >
                  {loadingModalData ? (
                    <option value="">Cargando clientes...</option>
                  ) : (
                    <>
                      <option value="">Selecciona un cliente</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.fullName} ({c.phone})</option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              {/* Empresa o Negocio — solo SUPER_ADMIN */}
              {isSuperAdmin && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <span>Empresa o Negocio *</span>
                  </label>
                  <select
                    value={selectedSalonId}
                    onChange={(e) => setSelectedSalonId(e.target.value)}
                    disabled={loadingModalData}
                    className="w-full"
                    required
                  >
                    {loadingModalData ? (
                      <option value="">Cargando negocios...</option>
                    ) : (
                      <>
                        <option value="">Selecciona un negocio</option>
                        {salons.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              )}

              {/* Servicio */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                  <Scissors className="w-4 h-4 text-slate-500" />
                  <span>Servicio *</span>
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  disabled={loadingModalData || loadingServices || (isSuperAdmin && !selectedSalonId)}
                  className="w-full"
                  required
                >
                  {loadingModalData || loadingServices ? (
                    <option value="">Cargando servicios...</option>
                  ) : isSuperAdmin && !selectedSalonId ? (
                    <option value="">Selecciona primero un negocio</option>
                  ) : (
                    <>
                      <option value="">Selecciona un servicio</option>
                      {services.filter(s => s.active).map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.durationMins} min | ${s.price})</option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              {/* Fecha */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>Fecha *</span>
                </label>
                <DatePicker
                  value={selectedDate}
                  onChange={setSelectedDate}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  placeholder="Selecciona una fecha"
                  disabled={loadingModalData}
                />
              </div>

              {/* Rango de horario */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>Rango de Horario *</span>
                </label>
                <TimeRangePicker
                  startTime={selectedStartTime}
                  endTime={selectedEndTime}
                  onStartChange={setSelectedStartTime}
                  onEndChange={setSelectedEndTime}
                  disabled={loadingModalData}
                />
              </div>

              {/* Notas */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>Notas / Requerimientos</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-xs font-semibold text-slate-950 focus:outline-none focus:ring-2 focus:ring-brand-primary-500/20 focus:border-brand-primary-600 resize-none smooth-transition shadow-sm"
                  placeholder="Ej. Diseño particular de uñas, alergias, café..."
                />
              </div>

              {/* Acciones */}
              <div className="flex gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100 smooth-transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || loadingModalData || isFormIncomplete}
                  className="flex-1 rounded-xl bg-brand-primary px-4 py-3 text-xs font-bold text-white hover:bg-brand-primary-dark disabled:opacity-50 disabled:cursor-not-allowed smooth-transition shadow-sm"
                >
                  {isPending ? 'Guardando...' : 'Agendar Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}