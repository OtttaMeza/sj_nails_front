'use server'

import { createService, getServices, updateService, deleteService } from '@/lib/api/services'
import { getSalons } from '@/lib/api/salons'
import { getSession } from '@/lib/auth/session'
import { CreateSalonServiceRequest, UpdateSalonServiceRequest, SalonResponse, SalonServiceResponse } from '@/lib/types'
import { revalidatePath } from 'next/cache'

interface CreateServiceResult {
  ok: boolean
  service?: SalonServiceResponse
  error?: string
}

interface GetSalonsResult {
  ok: boolean
  salons?: SalonResponse[]
  error?: string
}

function extractError(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message: unknown }).message)
  }
  return fallback
}

export async function createServiceAction(
  data: CreateSalonServiceRequest
): Promise<CreateServiceResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'No autenticado' }
  if (session.role === 'USER') return { ok: false, error: 'Sin permisos' }
  if (session.role === 'SUPER_ADMIN' && !data.salonId) {
    return { ok: false, error: 'Debes seleccionar un negocio' }
  }

  try {
    const service = await createService(data, session.backendToken)
    revalidatePath('/servicios')
    return { ok: true, service }
  } catch (err) {
    console.error('[createServiceAction]', err)
    return { ok: false, error: extractError(err, 'Error al crear el servicio') }
  }
}

interface GetServicesResult {
  ok: boolean
  services?: SalonServiceResponse[]
  error?: string
}

export async function getServicesForSalonAction(salonId: number): Promise<GetServicesResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'No autenticado' }
  if (session.role !== 'SUPER_ADMIN') return { ok: false, error: 'Sin permisos' }

  try {
    const services = await getServices(session.backendToken, salonId)
    return { ok: true, services }
  } catch (err) {
    console.error('[getServicesForSalonAction]', err)
    return { ok: false, error: extractError(err, 'Error al obtener servicios') }
  }
}

interface UpdateServiceResult {
  ok: boolean
  service?: SalonServiceResponse
  error?: string
}

interface DeleteServiceResult {
  ok: boolean
  error?: string
}

export async function updateServiceAction(
  id: number,
  data: UpdateSalonServiceRequest,
  salonId?: number,
): Promise<UpdateServiceResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'No autenticado' }
  if (session.role === 'USER') return { ok: false, error: 'Sin permisos' }
  if (session.role === 'SUPER_ADMIN' && !salonId) {
    return { ok: false, error: 'Debes seleccionar un negocio' }
  }

  try {
    const service = await updateService(id, data, session.backendToken, salonId)
    revalidatePath('/servicios')
    return { ok: true, service }
  } catch (err) {
    console.error('[updateServiceAction]', err)
    return { ok: false, error: extractError(err, 'Error al actualizar el servicio') }
  }
}

export async function deleteServiceAction(
  id: number,
  salonId?: number,
): Promise<DeleteServiceResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'No autenticado' }
  if (session.role === 'USER') return { ok: false, error: 'Sin permisos' }
  if (session.role === 'SUPER_ADMIN' && !salonId) {
    return { ok: false, error: 'Debes seleccionar un negocio' }
  }

  try {
    await deleteService(id, session.backendToken, salonId)
    revalidatePath('/servicios')
    return { ok: true }
  } catch (err) {
    console.error('[deleteServiceAction]', err)
    return { ok: false, error: extractError(err, 'Error al desactivar el servicio') }
  }
}

export async function getSalonsForServiceAction(): Promise<GetSalonsResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'No autenticado' }
  if (session.role !== 'SUPER_ADMIN') return { ok: false, error: 'Sin permisos' }

  try {
    const salons = await getSalons(session.backendToken)
    return { ok: true, salons }
  } catch (err) {
    console.error('[getSalonsForServiceAction]', err)
    return { ok: false, error: extractError(err, 'Error al obtener negocios') }
  }
}