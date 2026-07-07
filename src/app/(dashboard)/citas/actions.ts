'use server'

import { createAppointment, cancelAppointment, getWeeklyAppointments } from '@/lib/api/appointments'
import { getAvailableSlots } from '@/lib/api/schedules'
import { getClients } from '@/lib/api/clients'
import { getServices } from '@/lib/api/services'
import { getSalons } from '@/lib/api/salons'
import { getSession } from '@/lib/auth/session'
import { AppointmentResponse, ClientResponse, CreateAppointmentRequest, SalonResponse, SalonServiceResponse, WeeklyDay } from '@/lib/types'
import { revalidatePath } from 'next/cache'

interface CreateActionResult {
  ok: boolean
  appointment?: AppointmentResponse
  error?: string
}

interface CancelActionResult {
  ok: boolean
  error?: string
}

interface AvailableSlotsResult {
  ok: boolean
  slots?: string[]
  error?: string
}

export async function createAppointmentAction(
  data: CreateAppointmentRequest
): Promise<CreateActionResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'No autenticado' }

  try {
    const appointment = await createAppointment(data, session.backendToken)
    revalidatePath('/citas')
    revalidatePath('/')
    return { ok: true, appointment }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al crear la cita'
    return { ok: false, error: message }
  }
}

export async function cancelAppointmentAction(id: number): Promise<CancelActionResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'No autenticado' }

  try {
    await cancelAppointment(id, session.backendToken)
    revalidatePath('/citas')
    revalidatePath('/')
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al cancelar la cita'
    return { ok: false, error: message }
  }
}

export async function getAvailableSlotsAction(
  serviceId: number,
  date: string
): Promise<AvailableSlotsResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'No autenticado' }

  try {
    const slots = await getAvailableSlots(serviceId, date, session.backendToken)
    return { ok: true, slots }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al obtener horarios disponibles'
    return { ok: false, error: message }
  }
}

interface GetClientsResult {
  ok: boolean
  clients?: ClientResponse[]
  error?: string
}

interface GetServicesResult {
  ok: boolean
  services?: SalonServiceResponse[]
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

export async function getClientsAction(): Promise<GetClientsResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'No autenticado' }

  try {
    const clients = await getClients(session.backendToken)
    return { ok: true, clients }
  } catch (err) {
    console.error('[getClientsAction]', err)
    return { ok: false, error: extractError(err, 'Error al obtener clientes') }
  }
}

export async function getServicesAction(salonId?: number): Promise<GetServicesResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'No autenticado' }

  const resolvedSalonId = session.role === 'SUPER_ADMIN' ? salonId : undefined

  try {
    const services = await getServices(session.backendToken, resolvedSalonId)
    return { ok: true, services }
  } catch (err) {
    console.error('[getServicesAction]', err)
    return { ok: false, error: extractError(err, 'Error al obtener servicios') }
  }
}

interface GetWeeklyResult {
  ok: boolean
  days?: WeeklyDay[]
  error?: string
}

function extractWeeklyDays(raw: unknown): WeeklyDay[] {
  if (Array.isArray(raw)) return raw as WeeklyDay[]
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    for (const key of ['days', 'week', 'data', 'items', 'appointments']) {
      if (Array.isArray(obj[key])) return obj[key] as WeeklyDay[]
    }
  }
  return []
}

export async function getWeeklyAppointmentsAction(params?: {
  startDate?: string
  endDate?: string
  salonId?: number
}): Promise<GetWeeklyResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'No autenticado' }

  try {
    const raw = await getWeeklyAppointments(session.backendToken, params)
    const days = extractWeeklyDays(raw)
    return { ok: true, days }
  } catch (err) {
    console.error('[getWeeklyAppointmentsAction]', err)
    return { ok: false, error: extractError(err, 'Error al obtener agenda semanal') }
  }
}

export async function getSalonsAction(): Promise<GetSalonsResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'No autenticado' }
  if (session.role !== 'SUPER_ADMIN') return { ok: false, error: 'Sin permisos' }

  try {
    const salons = await getSalons(session.backendToken)
    return { ok: true, salons }
  } catch (err) {
    console.error('[getSalonsAction]', err)
    return { ok: false, error: extractError(err, 'Error al obtener negocios') }
  }
}
