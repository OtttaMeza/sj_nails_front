'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ClientResponse } from '@/lib/types'
import { createClientAction } from './actions'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Cake, 
  MessageSquare, 
  Calendar, 
  Sparkles, 
  X, 
  Info, 
  Check, 
  ChevronRight, 
  FileText,
  User,
  AlertCircle
} from 'lucide-react'

const createClientSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().min(7, 'Teléfono inválido (mínimo 7 dígitos)'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  whatsappOptin: z.boolean(),
  birthday: z.string().optional(),
  notes: z.string().optional(),
})

type CreateClientValues = z.infer<typeof createClientSchema>

interface Props {
  initialClients: ClientResponse[]
}

export default function ClientesClient({ initialClients }: Props) {
  const [clients, setClients] = useState<ClientResponse[]>(initialClients)
  const [showModal, setShowModal] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Estado para el panel de detalles del cliente (Drawer)
  const [selectedClient, setSelectedClient] = useState<ClientResponse | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [whatsappFilter, setWhatsappFilter] = useState<'ALL' | 'YES' | 'NO'>('ALL')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateClientValues>({
    resolver: zodResolver(createClientSchema),
    defaultValues: { whatsappOptin: false },
  })

  function closeModal() {
    setShowModal(false)
    setServerError(null)
    reset()
  }

  async function onSubmit(values: CreateClientValues) {
    setServerError(null)
    const result = await createClientAction({
      fullName: values.fullName,
      phone: values.phone,
      email: values.email || undefined,
      whatsappOptin: values.whatsappOptin,
      birthday: values.birthday || undefined,
      notes: values.notes || undefined,
    })

    if (!result.ok) {
      setServerError(result.error ?? 'Error al crear cliente')
      return
    }

    if (result.client) {
      startTransition(() => {
        setClients((prev) => [result.client!, ...prev])
      })
    }
    closeModal()
  }

  // Filtrado de clientes
  const filteredClients = clients.filter((client) => {
    const matchesSearch = client.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          client.phone.includes(searchTerm) || 
                          (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
    
    let matchesWhatsapp = true
    if (whatsappFilter === 'YES') matchesWhatsapp = client.whatsappOptin
    if (whatsappFilter === 'NO') matchesWhatsapp = !client.whatsappOptin

    return matchesSearch && matchesWhatsapp
  })

  // Verificar si es el cumpleaños del cliente este mes
  const isBirthdayThisMonth = (birthdayStr: string | null) => {
    if (!birthdayStr) return false
    try {
      const birthDate = new Date(birthdayStr)
      const currentMonth = new Date().getMonth()
      return birthDate.getMonth() === currentMonth
    } catch {
      return false
    }
  }

  // Helper de fecha legible
  const formatDateStr = (dateStr: string, formatPattern: string) => {
    try {
      return format(new Date(dateStr), formatPattern, { locale: es })
    } catch {
      return '—'
    }
  }

  return (
    <div className="space-y-6 relative">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Clientes</h1>
          <p className="text-slate-700 mt-1 text-sm font-semibold">
            {clients.length} cliente{clients.length !== 1 ? 's' : ''} registrado{clients.length !== 1 ? 's' : ''} en la base de datos.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-sm font-bold text-white hover:bg-brand-primary-dark smooth-transition shadow-md shadow-brand-primary/10"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-slate-200 pb-4">
        {/* Buscador */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-350 bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent smooth-transition shadow-sm"
          />
        </div>
        {/* Filtro WhatsApp */}
        <select
          value={whatsappFilter}
          onChange={(e) => setWhatsappFilter(e.target.value as 'ALL' | 'YES' | 'NO')}
          className="w-full sm:w-52"
        >
          <option value="ALL">WhatsApp (Todos)</option>
          <option value="YES">Acepta WhatsApp</option>
          <option value="NO">No acepta WhatsApp</option>
        </select>
      </div>

      {/* Contenedor Principal de la Tabla */}
      <div className="glass-card rounded-2xl border border-slate-300/85 overflow-hidden bg-white shadow-lg">
        {filteredClients.length === 0 ? (
          <div className="py-20 text-center">
            <User className="w-14 h-14 text-slate-400 mx-auto mb-3 animate-pulse" />
            <p className="text-slate-800 text-sm font-bold">No se encontraron clientes</p>
            <p className="text-slate-500 text-xs mt-1">Limpia los filtros o registra un cliente nuevo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100 text-slate-700">
                  <th className="px-6 py-4.5 text-left font-extrabold">Nombre</th>
                  <th className="px-6 py-4.5 text-left font-extrabold">Teléfono</th>
                  <th className="px-6 py-4.5 text-left font-extrabold">Email</th>
                  <th className="px-6 py-4.5 text-center font-extrabold">WhatsApp</th>
                  <th className="px-6 py-4.5 text-left font-extrabold">Cumpleaños</th>
                  <th className="px-6 py-4.5 text-left font-extrabold">Registro</th>
                  <th className="px-6 py-4.5 text-right font-extrabold">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {filteredClients.map((client) => {
                  const isBday = isBirthdayThisMonth(client.birthday)

                  return (
                    <tr 
                      key={client.id} 
                      onClick={() => setSelectedClient(client)}
                      className="hover:bg-slate-50 smooth-transition cursor-pointer"
                    >
                      {/* Nombre */}
                      <td className="px-6 py-4 font-black text-slate-950 text-sm">
                        <div className="flex items-center gap-2">
                          <span>{client.fullName}</span>
                          {isBday && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-pink-600 border border-pink-700 px-2.5 py-0.5 text-[9px] font-black text-white shadow-sm animate-bounce">
                              <Cake className="w-3.5 h-3.5 text-white" />
                              <span>CUMPLE MES!</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Teléfono */}
                      <td className="px-6 py-4 text-slate-900 font-extrabold text-sm">
                        {client.phone}
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 text-slate-800 font-bold">
                        {client.email ?? '—'}
                      </td>

                      {/* WhatsApp Opt-in */}
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black border ${
                          client.whatsappOptin 
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm shadow-emerald-500/10' 
                            : 'bg-slate-100 text-slate-500 border-slate-300'
                        }`}>
                          {client.whatsappOptin ? (
                            <>
                              <Check className="w-3 h-3 text-white" />
                              <span>Sí</span>
                            </>
                          ) : (
                            <span>No</span>
                          )}
                        </span>
                      </td>

                      {/* Cumpleaños */}
                      <td className="px-6 py-4 text-slate-900 font-bold">
                        {client.birthday
                          ? formatDateStr(client.birthday, 'd \'de\' MMM')
                          : '—'}
                      </td>

                      {/* Registrado */}
                      <td className="px-6 py-4 text-slate-600 font-bold">
                        {formatDateStr(client.createdAt, 'd MMM yyyy')}
                      </td>

                      {/* Botón Ver Detalles */}
                      <td className="px-6 py-4 text-right">
                        <button className="text-slate-500 hover:text-slate-950 p-1.5 rounded-lg hover:bg-slate-200 smooth-transition">
                          <ChevronRight className="w-4.5 h-4.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer: Panel Lateral de Detalles de Cliente */}
      {selectedClient && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity duration-300"
            onClick={() => setSelectedClient(null)}
          />
          <div className="fixed inset-y-0 right-0 w-full sm:max-w-md bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col transition-transform duration-300 ease-in-out transform translate-x-0 h-screen">
            {/* Cabecera Drawer */}
            <div className="h-20 border-b border-slate-200 px-6 flex items-center justify-between">
              <h2 className="text-md font-black text-slate-950 flex items-center gap-2">
                <Info className="w-5.5 h-5.5 text-brand-primary-600" />
                <span>Perfil de Cliente</span>
              </h2>
              <button 
                onClick={() => setSelectedClient(null)}
                className="text-slate-500 hover:text-slate-800 rounded-lg p-1.5 hover:bg-slate-100 smooth-transition"
              >
                <X className="w-5.5 h-5.5" />
              </button>
            </div>

            {/* Contenido Drawer */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              {/* Bloque Identidad */}
              <div className="flex items-center gap-4 bg-slate-100 border border-slate-200 rounded-2xl p-5 shadow-inner">
                <div className="w-16 h-16 rounded-2xl bg-brand-primary-600 flex items-center justify-center font-black text-xl text-white shadow-md">
                  {selectedClient.fullName.substring(0, 2).toUpperCase()}
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-lg font-black text-slate-950">{selectedClient.fullName}</h3>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-slate-200 px-2 py-0.5 rounded-full">
                    ID: #{selectedClient.id}
                  </span>
                </div>
              </div>

              {/* Bloque Información */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2">
                  Datos de Contacto
                </h4>
                <div className="space-y-3.5">
                  <div className="flex items-center gap-3 text-xs">
                    <Phone className="w-4.5 h-4.5 text-brand-primary-600" />
                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">Teléfono</span>
                      <span className="text-slate-950 font-black text-sm">{selectedClient.phone}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <Mail className="w-4.5 h-4.5 text-slate-500" />
                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">Email</span>
                      <span className="text-slate-950 font-extrabold text-sm">{selectedClient.email ?? 'No registrado'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preferencias / Notificaciones */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2">
                  Preferencias
                </h4>
                <div className="space-y-3.5">
                  <div className="flex items-center gap-3 text-xs">
                    <MessageSquare className="w-4.5 h-4.5 text-emerald-600" />
                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">Notificaciones de WhatsApp</span>
                      <span className={`inline-flex items-center gap-1 font-extrabold text-xs mt-0.5 ${selectedClient.whatsappOptin ? 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded' : 'text-slate-600 bg-slate-100 px-2 py-0.5 rounded'}`}>
                        {selectedClient.whatsappOptin ? 'Permitido (Opt-in)' : 'Deshabilitado'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <Cake className="w-4.5 h-4.5 text-brand-primary-600 animate-bounce" />
                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">Cumpleaños</span>
                      <span className="text-slate-950 font-black text-sm">
                        {selectedClient.birthday 
                          ? formatDateStr(selectedClient.birthday, 'd \'de\' MMMM yyyy') 
                          : 'No registrado'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <Calendar className="w-4.5 h-4.5 text-slate-550" />
                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">Fecha de Registro</span>
                      <span className="text-slate-950 font-extrabold text-sm">
                        {formatDateStr(selectedClient.createdAt, 'd \'de\' MMMM yyyy, h:mm a')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notas de Historial */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2">
                  <FileText className="w-4.5 h-4.5 text-slate-400" />
                  <span>Notas / Preferencias Técnicas</span>
                </div>
                <div className="p-4 bg-slate-100 rounded-2xl border border-slate-250 shadow-inner">
                  <p className="text-xs text-slate-800 leading-relaxed font-semibold italic">
                    {(selectedClient as any).notes || 'Sin anotaciones particulares sobre este cliente. Las notas se pueden registrar al agendar citas.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Pie Drawer */}
            <div className="h-20 border-t border-slate-200 px-6 flex items-center bg-slate-50">
              <button 
                onClick={() => setSelectedClient(null)}
                className="w-full rounded-xl border border-slate-350 py-3 text-xs font-bold text-slate-800 hover:bg-slate-200 smooth-transition"
              >
                Cerrar Perfil
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal: Crear Nuevo Cliente */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 mx-4 relative overflow-hidden">
            {/* Cabecera Modal */}
            <div className="flex items-center justify-between mb-5 border-b border-slate-200 pb-3">
              <h2 className="text-lg font-black text-slate-950 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-primary-600" />
                <span>Registrar Cliente</span>
              </h2>
              <button 
                onClick={closeModal} 
                className="text-slate-500 hover:text-slate-800 rounded-lg p-1 hover:bg-slate-100 smooth-transition"
              >
                <X className="w-5.5 h-5.5" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              {/* Nombre completo */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-900 uppercase">Nombre completo *</label>
                <input
                  {...register('fullName')}
                  className="w-full rounded-xl border border-slate-355 bg-white px-3 py-3 text-xs font-semibold text-slate-955 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary smooth-transition shadow-sm"
                  placeholder="Ej. María García"
                />
                {errors.fullName && <p className="text-[10px] text-rose-700 font-bold mt-0.5">{errors.fullName.message}</p>}
              </div>

              {/* Teléfono */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-900 uppercase">Teléfono móvil *</label>
                <input
                  {...register('phone')}
                  type="tel"
                  className="w-full rounded-xl border border-slate-355 bg-white px-3 py-3 text-xs font-semibold text-slate-955 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary smooth-transition shadow-sm"
                  placeholder="Ej. 3001234567"
                />
                {errors.phone && <p className="text-[10px] text-rose-700 font-bold mt-0.5">{errors.phone.message}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-900 uppercase">Email</label>
                <input
                  {...register('email')}
                  type="email"
                  className="w-full rounded-xl border border-slate-355 bg-white px-3 py-3 text-xs font-semibold text-slate-955 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary smooth-transition shadow-sm"
                  placeholder="Ej. maria@example.com"
                />
                {errors.email && <p className="text-[10px] text-rose-700 font-bold mt-0.5">{errors.email.message}</p>}
              </div>

              {/* Cumpleaños */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-900 uppercase">Cumpleaños</label>
                <input
                  {...register('birthday')}
                  type="date"
                  className="w-full rounded-xl border border-slate-355 bg-white px-3 py-3 text-xs font-semibold text-slate-955 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary smooth-transition shadow-sm"
                />
              </div>

              {/* Notas */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-900 uppercase">Notas / Alergias / Preferencias</label>
                <textarea
                  {...register('notes')}
                  rows={2}
                  className="w-full rounded-xl border border-slate-355 bg-white px-3 py-3 text-xs font-semibold text-slate-955 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary resize-none smooth-transition shadow-sm"
                  placeholder="Ej. Prefiere café negro, alérgica a esmaltes acrílicos..."
                />
              </div>

              {/* WhatsApp Opt-in */}
              <div className="flex items-center gap-2.5 py-1.5">
                <input
                  {...register('whatsappOptin')}
                  id="whatsappOptin"
                  type="checkbox"
                  className="w-4.5 h-4.5 rounded border-slate-355 text-brand-primary-600 focus:ring-brand-primary-500/30 accent-brand-primary-600 cursor-pointer"
                />
                <label htmlFor="whatsappOptin" className="text-xs text-slate-900 font-extrabold cursor-pointer select-none">
                  Acepta recibir notificaciones automatizadas por WhatsApp
                </label>
              </div>

              {/* Errores Servidor */}
              {serverError && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-start gap-2 animate-bounce">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-rose-700 font-bold">{serverError}</p>
                </div>
              )}

              {/* Botones de Acción */}
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
                  disabled={isSubmitting || isPending}
                  className="flex-1 rounded-xl bg-brand-primary px-4 py-3 text-xs font-bold text-white hover:bg-brand-primary-dark disabled:opacity-50 disabled:cursor-not-allowed smooth-transition shadow-sm"
                >
                  {isSubmitting ? 'Registrando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
