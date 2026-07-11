'use server'

import { getUsers, createUser, updateUser, deactivateUser } from '@/lib/api/users'
import { getSalons } from '@/lib/api/salons'
import { getSession } from '@/lib/auth/session'
import { UserResponse, CreateUserRequest, UpdateUserRequest, SalonResponse } from '@/lib/types'
import { revalidatePath } from 'next/cache'

function extractError(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message: unknown }).message)
  }
  return fallback
}

interface UsersResult {
  ok: boolean
  users?: UserResponse[]
  error?: string
}

interface UserResult {
  ok: boolean
  user?: UserResponse
  error?: string
}

interface ActionResult {
  ok: boolean
  error?: string
}

interface SalonsResult {
  ok: boolean
  salons?: SalonResponse[]
  error?: string
}

export async function getUsersForSalonAction(salonId: number): Promise<UsersResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'No autenticado' }
  if (session.role !== 'SUPER_ADMIN') return { ok: false, error: 'Sin permisos' }

  try {
    const users = await getUsers(session.backendToken, salonId)
    return { ok: true, users }
  } catch (err) {
    console.error('[getUsersForSalonAction]', err)
    return { ok: false, error: extractError(err, 'Error al obtener usuarios') }
  }
}

export async function createUserAction(data: CreateUserRequest): Promise<UserResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'No autenticado' }
  if (session.role === 'USER') return { ok: false, error: 'Sin permisos' }
  if (session.role === 'SUPER_ADMIN' && !data.salonId) {
    return { ok: false, error: 'Debes seleccionar un negocio' }
  }

  try {
    const user = await createUser(data, session.backendToken)
    revalidatePath('/usuarios')
    return { ok: true, user }
  } catch (err) {
    console.error('[createUserAction]', err)
    return { ok: false, error: extractError(err, 'Error al crear el usuario') }
  }
}

export async function updateUserAction(
  id: number,
  data: UpdateUserRequest,
  salonId?: number,
): Promise<UserResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'No autenticado' }
  if (session.role === 'USER') return { ok: false, error: 'Sin permisos' }
  if (session.role === 'SUPER_ADMIN' && !salonId) {
    return { ok: false, error: 'Debes seleccionar un negocio' }
  }

  try {
    const user = await updateUser(id, data, session.backendToken, session.role === 'SUPER_ADMIN' ? salonId : undefined)
    revalidatePath('/usuarios')
    return { ok: true, user }
  } catch (err) {
    console.error('[updateUserAction]', err)
    return { ok: false, error: extractError(err, 'Error al actualizar el usuario') }
  }
}

export async function deactivateUserAction(id: number, salonId?: number): Promise<ActionResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'No autenticado' }
  if (session.role === 'USER') return { ok: false, error: 'Sin permisos' }
  if (session.role === 'SUPER_ADMIN' && !salonId) {
    return { ok: false, error: 'Debes seleccionar un negocio' }
  }

  try {
    await deactivateUser(id, session.backendToken, session.role === 'SUPER_ADMIN' ? salonId : undefined)
    revalidatePath('/usuarios')
    return { ok: true }
  } catch (err) {
    console.error('[deactivateUserAction]', err)
    return { ok: false, error: extractError(err, 'Error al desactivar el usuario') }
  }
}

export async function getSalonsForUserAction(): Promise<SalonsResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'No autenticado' }
  if (session.role !== 'SUPER_ADMIN') return { ok: false, error: 'Sin permisos' }

  try {
    const salons = await getSalons(session.backendToken)
    return { ok: true, salons }
  } catch (err) {
    console.error('[getSalonsForUserAction]', err)
    return { ok: false, error: extractError(err, 'Error al obtener negocios') }
  }
}
