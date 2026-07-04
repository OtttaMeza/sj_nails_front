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
} from 'lucide-react'
import { AppointmentResponse, ClientResponse, SalonResponse, SalonServiceResponse, UserRole } from '@/lib/types'
import {
  createAppointmentAction,
  cancelAppointmentAction,
  getClientsAction,
  getServicesAction,
  getSalonsAction,
} from './actions'
import { useToast } from '@/components/ui/ToastProvider'
import DatePicker from '@/components/ui/DatePicker'
import TimeRangePicker from '@/components/ui/TimeRangePicker'
import { format, parseISO, isSameDay } from 'date-fns'
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

  const appointmentsByDay: { [key: string]: AppointmentResponse[] } = {}
  appointments.forEach(app => {
    const dateStr = format(parseISO(app.startTime), 'yyyy-MM-dd')
    if (!appointmentsByDay[dateStr]) appointmentsByDay[dateStr] = []
    appointmentsByDay[dateStr].push(app)
  })

  const next7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return format(d, 'yyyy-MM-dd')
  })

  const statusConfig = {
    PENDING:   { label: 'Pendiente',  bg: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',   icon: HelpCircle  },
    CONFIRMED: { label: 'Confirmada', bg: 'bg-emerald-100 text-emerald-950 border-emerald-300 font-bold', icon: CheckCircle2 },
    COMPLETED: { label: 'Completada', bg: 'bg-sky-100 text-sky-950 border-sky-300 font-bold',         icon: CheckCircle2 },
    CANCELLED: { label: 'Cancelada',  bg: 'bg-rose-100 text-rose-950 border-rose-300 font-bold',      icon: XCircle     },
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
              className="w-full sm:w-44 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent smooth-transition cursor-pointer shadow-sm"
            >
              <option value="ALL">Todos los estados</option>
              <option value="PENDING">Pendientes</option>
              <option value="CONFIRMED">Confirmadas</option>
              <option value="COMPLETED">Completadas</option>
              <option value="CANCELLED">Canceladas</option>
            </select>
          </div>
        )}
      </div>

      {/* Vista Lista */}
      {activeTab === 'lista' ? (
        <div className="glass-card rounded-2xl border border-slate-300/80 overflow-hidden bg-white shadow-lg">
          {sortedAppointments.length === 0 ? (
            <div className="py-20 text-center">
              <Calendar className="w-14 h-14 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-800 text-sm font-bold">No se encontraron citas en la agenda</p>
              <p className="text-slate-500 text-xs mt-1">Registra citas o limpia los criterios de búsqueda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100 text-slate-700">
                    <th className="px-6 py-4.5 text-left font-extrabold">Cliente</th>
                    <th className="px-6 py-4.5 text-left font-extrabold">Servicio</th>
                    <th className="px-6 py-4.5 text-left font-extrabold">Fecha y Hora</th>
                    <th className="px-6 py-4.5 text-left font-extrabold">Notas</th>
                    <th className="px-6 py-4.5 text-left font-extrabold">Estado</th>
                    <th className="px-6 py-4.5 text-right font-extrabold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {sortedAppointments.map((app) => {
                    const client = getClient(app.clientId)
                    const service = getService(app.serviceId)
                    const status = statusConfig[app.status] || statusConfig.PENDING
                    const StatusIcon = status.icon

                    return (
                      <tr key={app.id} className="hover:bg-slate-50 smooth-transition">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-extrabold text-slate-950 text-sm">{client?.fullName ?? 'Cliente'}</span>
                            <span className="text-slate-700 flex items-center gap-1.5 mt-1 font-semibold">
                              <Phone className="w-3.5 h-3.5 text-slate-500" />
                              <span>{client?.phone}</span>
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{service?.name ?? 'Servicio'}</span>
                            <span className="text-slate-600 mt-1 font-semibold">{service?.durationMins} min</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-950">
                              {format(parseISO(app.startTime), "d 'de' MMMM", { locale: es })}
                            </span>
                            <span className="text-slate-700 mt-1 font-bold">
                              {format(parseISO(app.startTime), 'HH:mm')} - {format(parseISO(app.endTime), 'HH:mm')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-700 italic max-w-xs truncate font-medium">
                          {app.notes || '—'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${status.bg}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            <span>{status.label}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {app.status !== 'CANCELLED' && app.status !== 'COMPLETED' ? (
                            <button
                              onClick={() => handleCancelAppointment(app.id)}
                              className="text-rose-700 hover:text-white border border-rose-200 hover:bg-rose-600 px-3 py-1.5 rounded-xl font-bold smooth-transition shadow-sm"
                            >
                              Cancelar Cita
                            </button>
                          ) : (
                            <span className="text-slate-400 font-bold">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Vista Agenda Semanal */
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {next7Days.map(dayStr => {
            const dayDate = new Date(`${dayStr}T00:00:00`)
            const dayApps = appointmentsByDay[dayStr] || []
            const isDayToday = isSameDay(dayDate, new Date())

            return (
              <div
                key={dayStr}
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
                    dayApps
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map(app => {
                        const client = getClient(app.clientId)
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
                              <p className="font-extrabold text-slate-950 truncate text-[12px]">{client?.fullName}</p>
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
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-xs font-semibold text-slate-950 focus:outline-none focus:ring-2 focus:ring-brand-primary-500/20 focus:border-brand-primary-600 smooth-transition cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
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
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-xs font-semibold text-slate-950 focus:outline-none focus:ring-2 focus:ring-brand-primary-500/20 focus:border-brand-primary-600 smooth-transition cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
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
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-xs font-semibold text-slate-950 focus:outline-none focus:ring-2 focus:ring-brand-primary-500/20 focus:border-brand-primary-600 smooth-transition cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
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