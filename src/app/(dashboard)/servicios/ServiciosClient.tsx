'use client'

import { useState, useTransition } from 'react'
import {
  Scissors,
  Plus,
  Clock,
  X,
  XCircle,
  Building2,
  DollarSign,
  FileText,
  Loader2,
  Pencil,
  Trash2,
} from 'lucide-react'
import { SalonResponse, SalonServiceResponse, UpdateSalonServiceRequest, UserRole } from '@/lib/types'
import {
  createServiceAction,
  getSalonsForServiceAction,
  getServicesForSalonAction,
  updateServiceAction,
  deleteServiceAction,
} from './actions'
import { useToast } from '@/components/ui/ToastProvider'
import { useConfirm } from '@/components/ui/ConfirmProvider'

interface Props {
  initialServices: SalonServiceResponse[]
  initialSalons: SalonResponse[]
  role: UserRole
}

export default function ServiciosClient({ initialServices, initialSalons, role }: Props) {
  const { toast } = useToast()
  const { confirm } = useConfirm()
  const isSuperAdmin = role === 'SUPER_ADMIN'

  const [services, setServices] = useState<SalonServiceResponse[]>(initialServices)
  const [salons, setSalons] = useState<SalonResponse[]>(initialSalons)
  const [selectedFilterSalonId, setSelectedFilterSalonId] = useState<string>('')
  const [loadingServices, setLoadingServices] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [loadingModalData, setLoadingModalData] = useState(false)

  const [selectedSalonId, setSelectedSalonId] = useState<string>('')
  const [name, setName] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [durationMins, setDurationMins] = useState<string>('')
  const [price, setPrice] = useState<string>('')
  const [formError, setFormError] = useState<string | null>(null)

  const [isPending, startTransition] = useTransition()

  const [editingService, setEditingService] = useState<SalonServiceResponse | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDurationMins, setEditDurationMins] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [isEditPending, startEditTransition] = useTransition()

  const isFormIncomplete = !name || !price || (isSuperAdmin && !selectedSalonId)

  function openEditModal(service: SalonServiceResponse) {
    setEditingService(service)
    setEditName(service.name)
    setEditDescription(service.description ?? '')
    setEditDurationMins(service.durationMins?.toString() ?? '')
    setEditPrice(service.price.toString())
    setEditError(null)
  }

  function closeEditModal() {
    setEditingService(null)
    setEditName('')
    setEditDescription('')
    setEditDurationMins('')
    setEditPrice('')
    setEditError(null)
  }

  async function handleUpdateService(e: React.FormEvent) {
    e.preventDefault()
    if (!editingService) return
    setEditError(null)

    const payload: UpdateSalonServiceRequest = {
      ...(editName ? { name: editName } : {}),
      ...(editDescription ? { description: editDescription } : {}),
      ...(editDurationMins ? { durationMins: Number(editDurationMins) } : {}),
      ...(editPrice ? { price: Number(editPrice) } : {}),
    }

    const salonId = isSuperAdmin && selectedFilterSalonId ? Number(selectedFilterSalonId) : undefined
    const result = await updateServiceAction(editingService.id, payload, salonId)

    if (!result.ok) {
      setEditError(result.error ?? 'Error al actualizar el servicio')
      return
    }

    if (result.service) {
      const updated = result.service
      startEditTransition(() => {
        setServices(prev => prev.map(s => s.id === updated.id ? updated : s))
      })
      toast('Servicio actualizado exitosamente', 'success')
      closeEditModal()
    }
  }

  async function handleDeleteService(serviceId: number) {
    const ok = await confirm({
      title: '¿Desactivar servicio?',
      message: 'El servicio quedará marcado como inactivo. Puedes volver a activarlo desde el backend.',
      confirmLabel: 'Desactivar',
      variant: 'danger',
    })
    if (!ok) return

    const salonId = isSuperAdmin && selectedFilterSalonId ? Number(selectedFilterSalonId) : undefined
    const result = await deleteServiceAction(serviceId, salonId)

    if (!result.ok) {
      toast(result.error ?? 'Error al desactivar el servicio', 'error')
      return
    }

    startTransition(() => {
      setServices(prev => prev.map(s => s.id === serviceId ? { ...s, active: false } : s))
    })
    toast('Servicio desactivado', 'success')
  }

  async function handleSalonFilterChange(salonId: string) {
    setSelectedFilterSalonId(salonId)
    setServices([])
    if (!salonId) return

    setLoadingServices(true)
    const res = await getServicesForSalonAction(Number(salonId))
    if (res.ok && res.services) {
      setServices(res.services)
    } else {
      toast(res.error ?? 'Error al cargar servicios', 'error')
    }
    setLoadingServices(false)
  }

  async function openModal() {
    setShowModal(true)

    if (isSuperAdmin && salons.length === 0) {
      setLoadingModalData(true)
      const res = await getSalonsForServiceAction()
      if (res.ok && res.salons) {
        setSalons(res.salons)
      } else {
        toast(res.error ?? 'Error al cargar negocios', 'error')
      }
      setLoadingModalData(false)
    }
  }

  function closeModal() {
    setShowModal(false)
    setSelectedSalonId('')
    setName('')
    setDescription('')
    setDurationMins('')
    setPrice('')
    setFormError(null)
  }

  async function handleCreateService(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    const result = await createServiceAction({
      ...(isSuperAdmin && selectedSalonId ? { salonId: Number(selectedSalonId) } : {}),
      name,
      description: description || undefined,
      durationMins: durationMins ? Number(durationMins) : undefined,
      price: Number(price),
    })

    if (!result.ok) {
      setFormError(result.error ?? 'Error al crear el servicio')
      return
    }

    if (result.service) {
      const newService = result.service
      startTransition(() => {
        setServices(prev => [newService, ...prev])
      })
      toast('Servicio creado exitosamente', 'success')
      closeModal()
    }
  }

  const inputClass =
    'w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-xs font-semibold text-slate-950 focus:outline-none focus:ring-2 focus:ring-brand-primary-500/20 focus:border-brand-primary-600 smooth-transition shadow-sm'

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">Servicios</h1>
          <p className="text-slate-700 mt-1 text-sm font-medium">Gestiona el catálogo de servicios del negocio.</p>
        </div>
        {role !== 'USER' && (
          <button
            onClick={openModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-sm font-bold text-white hover:bg-brand-primary-dark smooth-transition shadow-md shadow-brand-primary/10 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo Servicio</span>
          </button>
        )}
      </div>

      {/* Selector de negocio — solo SUPER_ADMIN */}
      {isSuperAdmin && (
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm">
          <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={selectedFilterSalonId}
            onChange={(e) => handleSalonFilterChange(e.target.value)}
            className="flex-1"
          >
            <option value="">Selecciona un negocio para ver sus servicios</option>
            {salons.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {loadingServices && <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0" />}
        </div>
      )}

      {/* Vista de sin permisos para USER */}
      {role === 'USER' ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-24 text-center shadow-sm">
          <XCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-700 text-sm font-bold">Sin permisos</p>
          <p className="text-slate-400 text-xs mt-1">No tienes acceso para ver esta sección.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(!isSuperAdmin || selectedFilterSalonId) && !loadingServices && (
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">
              {services.length} {services.length === 1 ? 'servicio' : 'servicios'}
            </p>
          )}

          {loadingServices ? (
            <div className="rounded-2xl border border-slate-200 bg-white py-24 text-center shadow-sm">
              <Loader2 className="w-10 h-10 text-slate-300 mx-auto mb-3 animate-spin" />
              <p className="text-slate-400 text-xs mt-1">Cargando servicios...</p>
            </div>
          ) : isSuperAdmin && !selectedFilterSalonId ? (
            <div className="rounded-2xl border border-slate-200 bg-white py-24 text-center shadow-sm">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-700 text-sm font-bold">Selecciona un negocio</p>
              <p className="text-slate-400 text-xs mt-1">Elige un negocio en el selector para ver sus servicios.</p>
            </div>
          ) : services.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white py-24 text-center shadow-sm">
              <Scissors className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-700 text-sm font-bold">Sin servicios registrados</p>
              <p className="text-slate-400 text-xs mt-1">Crea el primer servicio del catálogo.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
              {/* Header */}
              <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-3 bg-slate-950">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Descripción</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Duración</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Precio</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Acciones</span>
              </div>

              <div className="divide-y divide-slate-100">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className={`grid grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-4 smooth-transition
                      ${service.active ? 'hover:bg-slate-50/80' : 'opacity-60 bg-slate-50/60'}`}
                  >
                    {/* Nombre */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0">
                        <Scissors className="w-4 h-4 text-brand-primary" />
                      </div>
                      <p className="font-bold text-slate-900 text-sm truncate">{service.name}</p>
                    </div>

                    {/* Descripción */}
                    <p className="text-slate-500 text-xs truncate">
                      {service.description ?? '—'}
                    </p>

                    {/* Duración */}
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>{service.durationMins} min</span>
                    </div>

                    {/* Precio */}
                    <p className="font-bold text-slate-900 text-xs">
                      ${service.price.toLocaleString('es-CO')}
                    </p>

                    {/* Estado */}
                    <div>
                      {service.active ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold bg-slate-100 text-slate-500 border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                          Inactivo
                        </span>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(service)}
                        className="p-2 rounded-lg text-slate-500 hover:text-brand-primary hover:bg-brand-primary/10 smooth-transition"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {service.active && (
                        <button
                          onClick={() => handleDeleteService(service.id)}
                          className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 smooth-transition"
                          title="Desactivar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Editar Servicio */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 mx-4 relative">
            <div className="flex items-center justify-between mb-5 border-b border-slate-200 pb-3">
              <h2 className="text-lg font-black text-slate-950 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-brand-primary" />
                <span>Editar Servicio</span>
              </h2>
              <button
                onClick={closeEditModal}
                className="text-slate-500 hover:text-slate-800 rounded-lg p-1 hover:bg-slate-100 smooth-transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateService} className="space-y-4">
              {/* Nombre */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                  <Scissors className="w-4 h-4 text-slate-500" />
                  <span>Nombre</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Ej. Manicure Premium"
                  className={inputClass}
                />
              </div>

              {/* Descripción */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>Descripción</span>
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-xs font-semibold text-slate-950 focus:outline-none focus:ring-2 focus:ring-brand-primary-500/20 focus:border-brand-primary-600 resize-none smooth-transition shadow-sm"
                  placeholder="Ej. Limpieza y esmaltado"
                />
              </div>

              {/* Duración y Precio */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span>Duración (min)</span>
                  </label>
                  <input
                    type="number"
                    value={editDurationMins}
                    onChange={(e) => setEditDurationMins(e.target.value)}
                    min="1"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-slate-500" />
                    <span>Precio</span>
                  </label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    min="0"
                    className={inputClass}
                  />
                </div>
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
                  disabled={isEditPending}
                  className="flex-1 rounded-xl bg-brand-primary px-4 py-3 text-xs font-bold text-white hover:bg-brand-primary-dark disabled:opacity-50 disabled:cursor-not-allowed smooth-transition shadow-sm"
                >
                  {isEditPending ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo Servicio */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 mx-4 relative">
            {/* Cabecera */}
            <div className="flex items-center justify-between mb-5 border-b border-slate-200 pb-3">
              <h2 className="text-lg font-black text-slate-950 flex items-center gap-2">
                <Scissors className="w-5 h-5 text-brand-primary" />
                <span>Nuevo Servicio</span>
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-500 hover:text-slate-800 rounded-lg p-1 hover:bg-slate-100 smooth-transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="space-y-4">
              {/* Negocio — solo SUPER_ADMIN */}
              {isSuperAdmin && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <span>Negocio *</span>
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

              {/* Nombre */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                  <Scissors className="w-4 h-4 text-slate-500" />
                  <span>Nombre *</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Semipermanentes"
                  className={inputClass}
                  required
                />
              </div>

              {/* Descripción */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>Descripción</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-xs font-semibold text-slate-950 focus:outline-none focus:ring-2 focus:ring-brand-primary-500/20 focus:border-brand-primary-600 resize-none smooth-transition shadow-sm"
                  placeholder="Ej. Limpieza y esmaltado"
                />
              </div>

              {/* Duración */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>Duración (minutos)</span>
                </label>
                <input
                  type="number"
                  value={durationMins}
                  onChange={(e) => setDurationMins(e.target.value)}
                  placeholder="Ej. 60"
                  min="1"
                  className={inputClass}
                />
              </div>

              {/* Precio */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-slate-500" />
                  <span>Precio *</span>
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ej. 45000"
                  min="0"
                  className={inputClass}
                  required
                />
              </div>

              {/* Error de formulario */}
              {formError && (
                <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                  {formError}
                </p>
              )}

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
                  {isPending ? 'Guardando...' : 'Crear Servicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}