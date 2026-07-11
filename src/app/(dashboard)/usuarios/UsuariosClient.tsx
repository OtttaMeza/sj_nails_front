'use client'

import { useState, useTransition } from 'react'
import {
  UserCog,
  Plus,
  X,
  XCircle,
  Building2,
  Mail,
  Phone,
  Lock,
  Loader2,
  Pencil,
  UserX,
  ShieldCheck,
  User,
} from 'lucide-react'
import { UserResponse, SalonResponse, UpdateUserRequest, UserRole, CreateUserRole } from '@/lib/types'
import {
  createUserAction,
  getSalonsForUserAction,
  getUsersForSalonAction,
  updateUserAction,
  deactivateUserAction,
} from './actions'
import { useToast } from '@/components/ui/ToastProvider'
import { useConfirm } from '@/components/ui/ConfirmProvider'

interface Props {
  initialUsers: UserResponse[]
  initialSalons: SalonResponse[]
  role: UserRole
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrador',
  USER: 'Usuario',
}

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-xs font-semibold text-slate-950 focus:outline-none focus:ring-2 focus:ring-brand-primary-500/20 focus:border-brand-primary-600 smooth-transition shadow-sm'

export default function UsuariosClient({ initialUsers, initialSalons, role }: Props) {
  const { toast } = useToast()
  const { confirm } = useConfirm()
  const isSuperAdmin = role === 'SUPER_ADMIN'

  const [users, setUsers] = useState<UserResponse[]>(initialUsers)
  const [salons, setSalons] = useState<SalonResponse[]>(initialSalons)
  const [selectedFilterSalonId, setSelectedFilterSalonId] = useState<string>('')
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Create modal state
  const [showModal, setShowModal] = useState(false)
  const [loadingModalData, setLoadingModalData] = useState(false)
  const [createSalonId, setCreateSalonId] = useState<string>('')
  const [createFullName, setCreateFullName] = useState('')
  const [createEmail, setCreateEmail] = useState('')
  const [createPhone, setCreatePhone] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createRole, setCreateRole] = useState<CreateUserRole>('USER')
  const [createError, setCreateError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Edit modal state
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null)
  const [editFullName, setEditFullName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [isEditPending, startEditTransition] = useTransition()

  const isCreateIncomplete =
    !createFullName || !createEmail || !createPhone || !createPassword ||
    (isSuperAdmin && !createSalonId)

  async function handleSalonFilterChange(salonId: string) {
    setSelectedFilterSalonId(salonId)
    setUsers([])
    if (!salonId) return

    setLoadingUsers(true)
    const res = await getUsersForSalonAction(Number(salonId))
    if (res.ok && res.users) {
      setUsers(res.users)
    } else {
      toast(res.error ?? 'Error al cargar usuarios', 'error')
    }
    setLoadingUsers(false)
  }

  async function openCreateModal() {
    setShowModal(true)
    if (isSuperAdmin && salons.length === 0) {
      setLoadingModalData(true)
      const res = await getSalonsForUserAction()
      if (res.ok && res.salons) setSalons(res.salons)
      else toast(res.error ?? 'Error al cargar negocios', 'error')
      setLoadingModalData(false)
    }
  }

  function closeCreateModal() {
    setShowModal(false)
    setCreateSalonId('')
    setCreateFullName('')
    setCreateEmail('')
    setCreatePhone('')
    setCreatePassword('')
    setCreateRole('USER')
    setCreateError(null)
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    setCreateError(null)

    const result = await createUserAction({
      ...(isSuperAdmin && createSalonId ? { salonId: Number(createSalonId) } : {}),
      fullName: createFullName,
      email: createEmail,
      phone: createPhone,
      password: createPassword,
      role: createRole,
    })

    if (!result.ok) {
      setCreateError(result.error ?? 'Error al crear el usuario')
      return
    }

    if (result.user) {
      const newUser = result.user
      startTransition(() => setUsers(prev => [newUser, ...prev]))
      toast('Usuario creado exitosamente', 'success')
      closeCreateModal()
    }
  }

  function openEditModal(u: UserResponse) {
    setEditingUser(u)
    setEditFullName(u.fullName ?? '')
    setEditPhone(u.phone ?? '')
    setEditError(null)
  }

  function closeEditModal() {
    setEditingUser(null)
    setEditFullName('')
    setEditPhone('')
    setEditError(null)
  }

  async function handleUpdateUser(e: React.FormEvent) {
    e.preventDefault()
    if (!editingUser) return
    setEditError(null)

    const payload: UpdateUserRequest = {
      ...(editFullName ? { fullName: editFullName } : {}),
      ...(editPhone ? { phone: editPhone } : {}),
    }

    const salonId = isSuperAdmin && selectedFilterSalonId ? Number(selectedFilterSalonId) : undefined
    const result = await updateUserAction(editingUser.id, payload, salonId)

    if (!result.ok) {
      setEditError(result.error ?? 'Error al actualizar el usuario')
      return
    }

    if (result.user) {
      const updated = result.user
      startEditTransition(() => setUsers(prev => prev.map(u => u.id === updated.id ? updated : u)))
      toast('Usuario actualizado exitosamente', 'success')
      closeEditModal()
    }
  }

  async function handleDeactivateUser(userId: number) {
    const ok = await confirm({
      title: '¿Desactivar usuario?',
      message: 'El usuario no podrá acceder al sistema. Puedes reactivarlo desde el backend.',
      confirmLabel: 'Desactivar',
      variant: 'danger',
    })
    if (!ok) return

    const salonId = isSuperAdmin && selectedFilterSalonId ? Number(selectedFilterSalonId) : undefined
    const result = await deactivateUserAction(userId, salonId)

    if (!result.ok) {
      toast(result.error ?? 'Error al desactivar el usuario', 'error')
      return
    }

    startTransition(() => setUsers(prev => prev.map(u => u.id === userId ? { ...u, active: false } : u)))
    toast('Usuario desactivado', 'success')
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">Usuarios</h1>
          <p className="text-slate-700 mt-1 text-sm font-medium">Gestiona los usuarios con acceso al sistema.</p>
        </div>
        {role !== 'USER' && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-sm font-bold text-white hover:bg-brand-primary-dark smooth-transition shadow-md shadow-brand-primary/10 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo Usuario</span>
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
            <option value="">Selecciona un negocio para ver sus usuarios</option>
            {salons.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {loadingUsers && <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0" />}
        </div>
      )}

      {/* Vista sin permisos para USER */}
      {role === 'USER' ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-24 text-center shadow-sm">
          <XCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-700 text-sm font-bold">Sin permisos</p>
          <p className="text-slate-400 text-xs mt-1">No tienes acceso para ver esta sección.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(!isSuperAdmin || selectedFilterSalonId) && !loadingUsers && (
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">
              {users.length} {users.length === 1 ? 'usuario' : 'usuarios'}
            </p>
          )}

          {loadingUsers ? (
            <div className="rounded-2xl border border-slate-200 bg-white py-24 text-center shadow-sm">
              <Loader2 className="w-10 h-10 text-slate-300 mx-auto mb-3 animate-spin" />
              <p className="text-slate-400 text-xs mt-1">Cargando usuarios...</p>
            </div>
          ) : isSuperAdmin && !selectedFilterSalonId ? (
            <div className="rounded-2xl border border-slate-200 bg-white py-24 text-center shadow-sm">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-700 text-sm font-bold">Selecciona un negocio</p>
              <p className="text-slate-400 text-xs mt-1">Elige un negocio en el selector para ver sus usuarios.</p>
            </div>
          ) : users.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white py-24 text-center shadow-sm">
              <UserCog className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-700 text-sm font-bold">Sin usuarios registrados</p>
              <p className="text-slate-400 text-xs mt-1">Crea el primer usuario del negocio.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
              {/* Header tabla */}
              <div className="grid grid-cols-[2fr_2fr_1.5fr_1fr_1fr_auto] gap-4 items-center px-5 py-3 bg-slate-950">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Teléfono</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rol</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Acciones</span>
              </div>

              <div className="divide-y divide-slate-100">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className={`grid grid-cols-[2fr_2fr_1.5fr_1fr_1fr_auto] gap-4 items-center px-5 py-4 smooth-transition
                      ${u.active ? 'hover:bg-slate-50/80' : 'opacity-60 bg-slate-50/60'}`}
                  >
                    {/* Nombre */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-black text-brand-primary">
                          {(u.fullName ?? u.email ?? '?').substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <p className="font-bold text-slate-900 text-sm truncate">{u.fullName ?? '—'}</p>
                    </div>

                    {/* Email */}
                    <p className="text-slate-500 text-xs truncate">{u.email}</p>

                    {/* Teléfono */}
                    <p className="text-slate-500 text-xs truncate">{u.phone}</p>

                    {/* Rol */}
                    <div>
                      {u.role === 'SUPER_ADMIN' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold bg-violet-50 text-violet-700 border-violet-200">
                          <ShieldCheck className="w-3 h-3 shrink-0" />
                          {ROLE_LABELS[u.role]}
                        </span>
                      ) : u.role === 'ADMIN' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-blue-700 border-blue-200">
                          <ShieldCheck className="w-3 h-3 shrink-0" />
                          {ROLE_LABELS[u.role]}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold bg-slate-100 text-slate-600 border-slate-200">
                          <User className="w-3 h-3 shrink-0" />
                          {ROLE_LABELS[u.role]}
                        </span>
                      )}
                    </div>

                    {/* Estado */}
                    <div>
                      {u.active ? (
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
                        onClick={() => openEditModal(u)}
                        className="p-2 rounded-lg text-slate-500 hover:text-brand-primary hover:bg-brand-primary/10 smooth-transition"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {u.active && (
                        <button
                          onClick={() => handleDeactivateUser(u.id)}
                          className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 smooth-transition"
                          title="Desactivar"
                        >
                          <UserX className="w-3.5 h-3.5" />
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

      {/* Modal Editar Usuario */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 mx-4 relative">
            <div className="flex items-center justify-between mb-5 border-b border-slate-200 pb-3">
              <h2 className="text-lg font-black text-slate-950 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-brand-primary" />
                <span>Editar Usuario</span>
              </h2>
              <button onClick={closeEditModal} className="text-slate-500 hover:text-slate-800 rounded-lg p-1 hover:bg-slate-100 smooth-transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                  <UserCog className="w-4 h-4 text-slate-500" />
                  <span>Nombre completo</span>
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="Ej. Ana García López"
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <span>Teléfono</span>
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="Ej. +52 33 9999 1234"
                  className={inputClass}
                />
              </div>

              {editError && (
                <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                  {editError}
                </p>
              )}

              <div className="flex gap-3 pt-3 border-t border-slate-200">
                <button type="button" onClick={closeEditModal} className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100 smooth-transition">
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

      {/* Modal Nuevo Usuario */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 mx-4 relative">
            <div className="flex items-center justify-between mb-5 border-b border-slate-200 pb-3">
              <h2 className="text-lg font-black text-slate-950 flex items-center gap-2">
                <UserCog className="w-5 h-5 text-brand-primary" />
                <span>Nuevo Usuario</span>
              </h2>
              <button onClick={closeCreateModal} className="text-slate-500 hover:text-slate-800 rounded-lg p-1 hover:bg-slate-100 smooth-transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              {/* Negocio — solo SUPER_ADMIN */}
              {isSuperAdmin && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <span>Negocio *</span>
                  </label>
                  <select
                    value={createSalonId}
                    onChange={(e) => setCreateSalonId(e.target.value)}
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

              {/* Nombre completo */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                  <UserCog className="w-4 h-4 text-slate-500" />
                  <span>Nombre completo *</span>
                </label>
                <input
                  type="text"
                  value={createFullName}
                  onChange={(e) => setCreateFullName(e.target.value)}
                  placeholder="Ej. Ana García López"
                  className={inputClass}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <span>Email *</span>
                </label>
                <input
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="Ej. ana@salon.com"
                  className={inputClass}
                  required
                />
              </div>

              {/* Teléfono */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <span>Teléfono *</span>
                </label>
                <input
                  type="text"
                  value={createPhone}
                  onChange={(e) => setCreatePhone(e.target.value)}
                  placeholder="Ej. +57 300 123 4567"
                  className={inputClass}
                  required
                />
              </div>

              {/* Contraseña */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-slate-500" />
                  <span>Contraseña *</span>
                </label>
                <input
                  type="password"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  placeholder="Contraseña inicial"
                  className={inputClass}
                  required
                />
              </div>

              {/* Rol */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-slate-500" />
                  <span>Rol *</span>
                </label>
                <select
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value as CreateUserRole)}
                  className="w-full"
                  required
                >
                  <option value="USER">Usuario</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>

              {createError && (
                <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                  {createError}
                </p>
              )}

              <div className="flex gap-3 pt-3 border-t border-slate-200">
                <button type="button" onClick={closeCreateModal} className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100 smooth-transition">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || loadingModalData || isCreateIncomplete}
                  className="flex-1 rounded-xl bg-brand-primary px-4 py-3 text-xs font-bold text-white hover:bg-brand-primary-dark disabled:opacity-50 disabled:cursor-not-allowed smooth-transition shadow-sm"
                >
                  {isPending ? 'Guardando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
